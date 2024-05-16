import Game, { GameProps } from "../models/Game";
import Review, { ReviewProps } from "../models/Review";
import Tag, {TagProps} from "../models/Tag";
import postgres from "postgres";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import Router from "../router/Router";
import { createUTCDate } from "../utils";
import SessionManager from "../auth/SessionManager";
import Session from "../auth/SessionManager";
import Cookie from "../auth/Cookie";
import User, { InvalidCredentialsError } from "../models/User";
import { threadId } from "worker_threads";

/**
 * Controller for handling Todo CRUD operations.
 * Routes are registered in the `registerRoutes` method.
 * Each method should be called when a request is made to the corresponding route.
 */
export default class GameController {
  private sql: postgres.Sql<any>;

  constructor(sql: postgres.Sql<any>) {
    this.sql = sql;
  }

  /**
   * To register a route, call the corresponding method on
   * the router instance based on the HTTP method of the route.
   *
   * @param router Router instance to register routes on.
   *
   * @example router.get("/games", this.getGamesList);
   */
  registerRoutes(router: Router) {
    router.get("/home", this.getHomePage);
    router.get("/games", this.getGamesList);
    router.get("/wishlist", this.getWishList);
    router.get("/played", this.getPlayedList);
    router.post("/wishlist", this.addWishlist);
    router.post("/played", this.addPlayedList);
    
    // Any routes that include an `:id` parameter should be registered last.
    router.get("/games/:gamesId", this.getGame);
    router.delete("/wishlist/:id", this.removeWishlist);
    router.delete("/played/:id", this.removePlayedList);
    router.post("/search", this.getFilteredGamesList);
  }

  /**
   * This method should be called when a GET request is made to /games.
   * It should retrieve all games from the database and send them as a response.
   *
   * @param req The request object.
   * @param res The response object.
   *
   * @example GET /games
   */
  getGamesList = async (req: Request, res: Response) => {
    let games: Game[] = [];

    try {
      games = await Game.readAll(this.sql);
      const gamesList = games.map((game) => {
        return {
          ...game.props,
        };
      });
  
      let loggedIn: Boolean = this.checkIfLoggedIn(req, res);
      await res.send({
        statusCode: StatusCode.OK,
        message: "Game list retrieved",
        payload: {
          title: "Game List",
          games: gamesList,
          loggedIn: loggedIn,
        },
        template: "SearchView",
      });
  
    } catch (error) {
      this.goToError(res,"There was an error getting your games list. Try again.")
    }

    
  };
  getFilteredGamesList = async (req: Request, res: Response) => {
    let games: Game[] = [];

    try {
      games = await Game.readAll(this.sql);
      const gamesList = games.map((game) => {
        return {
          ...game.props,
        };
      });
  
      let searchedGame = req.body.search
      let filteredGamesList = gamesList.filter((game) => game.title.toUpperCase().includes(searchedGame.toUpperCase()))
  
      let loggedIn: Boolean = this.checkIfLoggedIn(req, res);
      await res.send({
        statusCode: StatusCode.OK,
        message: "Game list retrieved",
        payload: {
          title: "Game List",
          games: filteredGamesList,
          loggedIn: loggedIn,
        },
        template: "SearchView",
      });
    } catch (error) {
      this.goToError(res,"There was an error getting your games list. Try again.")
    }

   
  };
  getWishList = async (req: Request, res: Response) => {
    let loggedIn: Boolean = this.checkIfLoggedIn(req, res);
    if (loggedIn) {
      let sessionManager: SessionManager = SessionManager.getInstance();
      let sessionId = req.findCookie("session_id")?.value;
      if (sessionId) {
        let session = sessionManager.get(sessionId);
        if (session && session.data["userId"]) {
          let userId = session.data["userId"];
          let games: Game[] = [];

          try {
            games = await Game.readWishlist(this.sql, userId);
            const wishlist = games.map((game) => {
              return {
                ...game.props,
              };
            });
  
            await res.send({
              statusCode: StatusCode.OK,
              message: "Game list retrieved",
              payload: {
                title: "Wishlist",
                wishlist: wishlist,
                loggedIn: loggedIn,
              },
              template: "WishlistView",
            });
          } catch (error) {
            this.goToError(res,"There was an error getting your wishlist. Try again.")
          }


        }
      }
    }
	else {
		await res.send({
			statusCode: StatusCode.Redirect,
			message: "Login",
			payload: {
				title: "Login",
			},
			template: "LoginView"
		});

	}
  };

  addWishlist = async (req: Request, res: Response) => {
    let loggedIn: Boolean = this.checkIfLoggedIn(req, res);
    if (loggedIn) {
      let sessionManager: SessionManager = SessionManager.getInstance();
      let sessionId = req.findCookie("session_id")?.value;
      if (sessionId) {
        let session = sessionManager.get(sessionId);
        if (session) {
          if (session.data["userId"]) {
            let userId = session.data["userId"];
            const gameId = req.body.gameId;

            try {
              await Game.addWishlist(this.sql, userId, gameId);
              this.getWishList(req, res);
            } catch (error) {
              this.goToError(res,"There was an error adding this game to your wishlist. Try again.")
            }
          }
        }
      }
    }
    else{
      this.goToLogin(res)
    }
  };

  removeWishlist = async (req: Request, res: Response) => {
    let loggedIn: Boolean = this.checkIfLoggedIn(req, res);
    if (loggedIn) {
      let sessionManager: SessionManager = SessionManager.getInstance();
      let sessionId = req.findCookie("session_id")?.value;
      if (sessionId) {
        let session = sessionManager.get(sessionId);
        if (session) {
          if (session.data["userId"]) {
            let userId = session.data["userId"];
            const gameId = req.body.gameId;

            try {
              await Game.deleteWishlist(this.sql, userId, gameId);
              
               this.getWishList(req, res);
            } catch (error) {
              this.goToError(res,"There was an error removing this game from your wishlist. Try again.")
            }
          }
        }
      }
    }
  };

  getPlayedList = async (req: Request, res: Response) => {
    let loggedIn: Boolean = this.checkIfLoggedIn(req, res);
    if (loggedIn) {
      let sessionManager: SessionManager = SessionManager.getInstance();
      let sessionId = req.findCookie("session_id")?.value;
      if (sessionId) {
        let session = sessionManager.get(sessionId);
        if (session && session.data["userId"]) {
          let userId = session.data["userId"];
          let games: Game[] = [];

          try {
            games = await Game.readPlayedList(this.sql, userId);
            
          const played = games.map((game) => {
            return {
              ...game.props,
            };
          });

          await res.send({
            statusCode: StatusCode.OK,
            message: "Game list retrieved",
            payload: {
              title: "PlayedList",
              played: played,
              loggedIn: loggedIn,
            },
            template: "PlayedGamesView",
          });

          } catch (error) {
            this.goToError(res,"There was an error getting your played list. Try again.")
          }

        }
      }
    }
	else {
    this.goToLogin(res);

	}
  };

  addPlayedList = async (req: Request, res: Response) => {
    let loggedIn: Boolean = this.checkIfLoggedIn(req, res);
    if (loggedIn) {
      let sessionManager: SessionManager = SessionManager.getInstance();
      let sessionId = req.findCookie("session_id")?.value;
      if (sessionId) {
        let session = sessionManager.get(sessionId);
        if (session) {
          if (session.data["userId"]) {
            let userId = session.data["userId"];
            const gameId = req.body.gameId;

            try {
              if (await Game.readWishlistGameFromId(this.sql, userId, gameId)){
                await Game.deleteWishlist(this.sql, userId, gameId);
              }
              await Game.addPlayedList(this.sql, userId, gameId);
            } catch (error) {
              this.goToError(res,"There was an error adding this game to your played list. Try again.")
            }

            this.getPlayedList(req, res);
          }
        }
      }
    }
    else{

      this.goToLogin(res)
    }
  };

  removePlayedList = async (req: Request, res: Response) => {
    let loggedIn: Boolean = this.checkIfLoggedIn(req, res);
    if (loggedIn) {
      let sessionManager: SessionManager = SessionManager.getInstance();
      let sessionId = req.findCookie("session_id")?.value;
      if (sessionId) {
        let session = sessionManager.get(sessionId);
        if (session) {
          if (session.data["userId"]) {
            let userId = session.data["userId"];
            const gameId = req.body.gameId;

            try {
              await Game.deletePlayed(this.sql, userId, gameId);
              this.getPlayedList(req, res);
            } catch (error) {
              this.goToError(res,"There was an error deleting this game from your played list. Try again.")
            }

          }
        }
      }
    }
  };

  /**
   * This method should be called when a GET request is made to /games/:id.
   * It should retrieve a single todo from the database and send it as a response.
   *
   * @param req The request object.
   * @param res The response object.
   *
   * @example GET /games/1
   */
  getGame = async (req: Request, res: Response) => {
    const id = req.getId();
    let game: Game | null = null;
    let reviews: Review[] | null = [];
    let averageStars: number = 0;
    let tags: Tag[] | null = [];
    let gametags: string[] = [];

    game = await Game.read(this.sql, id);
    if (!game) {
      this.goToError(res, "A game with this ID was not found.");
      return;
    }

    gametags = await Game.readTagDescriptionsForGame(this.sql, id);
    tags = await Tag.readAll(this.sql);
    reviews = await Review.readGameReviews(this.sql, id);
    averageStars = await Review.readAverageStar(this.sql, id);

    let loggedIn: Boolean = this.checkIfLoggedIn(req, res);
    await res.send({
      statusCode: StatusCode.OK,
      message: "Todo retrieved",
      template: "GameView",
      payload: {
        game: game?.props,
        loggedIn: loggedIn,
        reviews: reviews,
        averageStars: averageStars,
        gametags: gametags,
        tags: tags
      },
    });
  };

  getHomePage = async (req: Request, res: Response) => {
    const id = req.getId();
    let popularGames: Game[] | null = null;
    let recentGames: Game[] | null = null;

    popularGames = await Game.readTop3Rated(this.sql);
    recentGames = await Game.readTop3Recent(this.sql);

    let loggedIn: Boolean = this.checkIfLoggedIn(req, res);

    await res.send({
      statusCode: StatusCode.OK,
      message: "HomePage retrieved",
      template: "HomeView",
      payload: {
          top3popular: popularGames,
          top3recent: recentGames,
          loggedIn: loggedIn,
      }
    });
    

  };

  // Reusable function I made since we need to check if the user is logged in before every action
  // Given the request object, checks that the request's session id exists in the session manager
  // and if it has a user id

  checkIfLoggedIn = (req: Request, res: Response) => {
    let sessionManager: SessionManager = SessionManager.getInstance();
    let sessionId = req.findCookie("session_id")?.value;
    if (sessionId) {
      let session = sessionManager.get(sessionId);
      if (session) {
        if (session.data["userId"]) {
          return true;
        }
      }
    }
    // this.goToLogin(res);
    return false;
  };
 

  // Reusable function I made since we need to direct back to login at every unauthorized action.
  goToLogin = async (res: Response) => {
    await res.send({
      statusCode: StatusCode.Unauthorized,
      message: "User needs to login before doing this action.",
      redirect: "/login",
    });
  };

  // Reusable function I made since we need to show message at every unauthorized action (when logged in)
  goToError = async (res: Response, message: string) => {
    await res.send({
      statusCode: StatusCode.Forbidden,
      message: "Unauthorized action.",
      payload: { error: message },
      template: "ErrorView",
    });
  };
}
