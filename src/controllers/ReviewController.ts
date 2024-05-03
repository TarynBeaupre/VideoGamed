//import Review, { GameProps } from "../models/Game";
import postgres from "postgres";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import Router from "../router/Router";
import { createUTCDate } from "../utils";
import SessionManager from "../auth/SessionManager";
import Session from "../auth/SessionManager";
import Cookie from "../auth/Cookie";
import { InvalidCredentialsError } from "../models/User";


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
	 * @example router.get("/todos", this.getTodoList);
	 */
	registerRoutes(router: Router) {
		router.get("/games", this.getGamesList);


		// Any routes that include an `:id` parameter should be registered last.
		router.get("/games/:gamesId", this.getGame);
	}


	/**
	 * This method should be called when a GET request is made to /todos.
	 * It should retrieve all todos from the database and send them as a response.
	 *
	 * @param req The request object.
	 * @param res The response object.
	 *
	 * @example GET /todos
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
	 * This method should be called when a GET request is made to /todos/:id.
	 * It should retrieve a single todo from the database and send it as a response.
	 *
	 * @param req The request object.
	 * @param res The response object.
	 *
	 * @example GET /todos/1
	 */
	getReview = async (req: Request, res: Response) => {
			const id = req.getId();
			let game: Game | null = null;
	
			game = await Game.read(this.sql, id);
			if (!game){
				//this.goToError(res)
				return;
			}
			
            let loggedIn: Boolean = this.checkIfLoggedIn(req,res);
			await res.send({
				statusCode: StatusCode.OK,
				message: "Todo retrieved",
				template: "GameView",
				payload: {
					game: game?.props,
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

	
}
