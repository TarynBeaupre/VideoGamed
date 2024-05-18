import Review, { ReviewProps } from "../models/Review";
import postgres from "postgres";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import Router from "../router/Router";
import { createUTCDate } from "../utils";
import SessionManager from "../auth/SessionManager";
import Session from "../auth/SessionManager";
import Cookie from "../auth/Cookie";
import { InvalidCredentialsError } from "../models/User";
import { check } from "prettier";
import Game from "../models/Game";
import GameController from "./GameController";

/**
 * Controller for handling Todo CRUD operations.
 * Routes are registered in the `registerRoutes` method.
 * Each method should be called when a request is made to the corresponding route.
 */
export default class ReviewController {
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
		// Any routes that include an `:id` parameter should be registered last.
		//router.get("/", this.getReview);
		router.get("/review", this.goToReviewPage)
		router.post("/review", this.createReview)

		router.post("/games/like/:id", this.likeReview)
	}

	likeReview = async (req: Request, res: Response) => {
		if (this.checkIfLoggedIn(req,res)){
			const id = req.getReviewId();
			let review = await Review.getSpecificReviewWithId(this.sql, id)
			if (review){
				//let gameId = req.body.gameId;
				let userId = req.session.get("userId");
				await Review.addReviewLike(this.sql, id, userId);
				let loggedIn: Boolean = this.checkIfLoggedIn(req,res);
				await res.send({
					statusCode: StatusCode.OK,
					message: "Review retrieved",
					redirect:"/games/" + review.props.reviewedGameId
				});
			}
		}
		else{
			this.goToLogin(res)
		}
	};


	goToReviewPage = async (req: Request, res: Response) => {
		if (this.checkIfLoggedIn(req,res)){
		let params = req.getSearchParams()
		let gameId = params.get("gameId")
		let userId = req.session.get("userId");
		if (gameId && userId){
			let review = await Review.getSpecificReview(this.sql, userId, Number(gameId))
			if (!review){
				let game = await Game.getPlayedGame(this.sql, userId, Number(gameId))
				if (!game){
					this.goToError(res, "You need to add this game to your played games before reviewing it.")
				}
				else{
					await res.send({
						statusCode: StatusCode.OK,
							message: "Going to leave review",
							template: "LeaveReviewView",
							payload: {
								gameId : gameId
							},
					});
				}

			}
			else{
				this.goToError(res, "You have already left a review for this game.")
			}
		}
		
	}
		else{
			this.goToLogin(res)
		}
	
	};
	

	createReview = async (req: Request, res: Response) => {
		if (this.checkIfLoggedIn(req,res)){
			
			let gameId = req.body.gameId
			let userId = req.session.get("userId");
			let props: ReviewProps = { userId: userId, title: req.body.title, likes: 0, review: req.body.review, stars: req.body.stars, reviewedGameId: Number(gameId)};
			await Review.create(this.sql,props )
			await Game.addStars(this.sql, gameId, req.body.stars)
			// Successfully created user account, direct to login page
			await res.send({
				statusCode: StatusCode.Created,
				redirect: "/games/" + gameId,
				message: "Review created"
			});
		
		}
		else{
			this.goToLogin(res)
		}
	};

	goToError = async (res: Response, message: string) => {
		
		await res.send({
		  statusCode: StatusCode.Forbidden,
		  message: "Unauthorized action.",
		  payload: { error: message },
		  template: "ErrorView",
		});
	  };

	  goToLogin = async (res: Response) => {
		await res.send({
		  statusCode: StatusCode.Unauthorized,
		  message: "User needs to login before doing this action.",
		  redirect: "/login",
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
		return false;

	}

}
