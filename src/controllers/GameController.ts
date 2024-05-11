import Game, { GameProps } from "../models/Game";
import Review, {ReviewProps} from "../models/Review";
import postgres from "postgres";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import Router from "../router/Router";
import { createUTCDate } from "../utils";
import SessionManager from "../auth/SessionManager";
import Session from "../auth/SessionManager";
import Cookie from "../auth/Cookie";
import User, { InvalidCredentialsError } from "../models/User";


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


		// Any routes that include an `:id` parameter should be registered last.
		router.get("/games/:gamesId", this.getGame);
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
		} catch (error) {
			const message = `Error while getting todo list: ${error}`;
			console.error(message);
		}

		const gamesList = games.map((game) => {
			return {
				...game.props,
			};
		});

        let loggedIn: Boolean = this.checkIfLoggedIn(req,res);
		await res.send({
			statusCode: StatusCode.OK,
			message: "Game list retrieved",
			payload: {
				title: "Game List",
				games: gamesList,
				loggedIn: loggedIn
			},
			template: "SearchView",
		});
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
	
			game = await Game.read(this.sql, id);
			if (!game){
				this.goToError(res)
				return;
			}

			reviews = await Review.readGameReviews(this.sql, id);
	

            let loggedIn: Boolean = this.checkIfLoggedIn(req,res);
			await res.send({
				statusCode: StatusCode.OK,
				message: "Todo retrieved",
				template: "GameView",
				payload: {
					game: game?.props,
					loggedIn: loggedIn,
					reviews: reviews,
				},
			});
		
		
	};

	getHomePage = async (req: Request, res: Response) => {
		const id = req.getId();
		let games: Game[] | null = null;

		games = await Game.readTop3Rated(this.sql)
		if (!games){
			this.goToError(res)
			return;
		}
		
		let loggedIn: Boolean = this.checkIfLoggedIn(req,res);
		await res.send({
			statusCode: StatusCode.OK,
			message: "Todo retrieved",
			template: "HomeView",
			payload: {
				top3: games,
				loggedIn: loggedIn,
			},
		});
	
	
};
	
	// Reusable function I made since we need to check if the user is logged in before every action
	// Given the request object, checks that the request's session id exists in the session manager
	// and if it has a user id
	
	checkIfLoggedIn = (req: Request, res: Response) => {

		let sessionManager: SessionManager = SessionManager.getInstance();
		let sessionId = req.findCookie("session_id")?.value;
		if (sessionId){
			let session = sessionManager.get(sessionId);
			if (session){
				if (session.data["userId"]){
					return true;
				}

			}
		}
		// this.goToLogin(res);
		return false;

	}

	// Reusable function I made since we need to direct back to login at every unauthorized action.
    goToLogin = async (res: Response) => {
		await res.send({
			statusCode: StatusCode.Unauthorized,
			message: "User needs to login before doing this action.",
			redirect: "/login"}); 
	}
	// Reusable function I made since we need to show message at every unauthorized action (when logged in)
    goToError = async (res: Response) => {
		await res.send({
			statusCode: StatusCode.Forbidden,
			message: "Unauthorized action.",
			payload: { error: "You are not allowed to modify this todo."},
			template: "ErrorView",
		});
	}

}
