import postgres from "postgres";
import Request from "../router/Request";
import Router from "../router/Router";
import Response, { StatusCode }  from "../router/Response";
import User, { UserProps } from "../models/User";
import { createUTCDate } from "../utils";
import { DuplicateEmailError } from "../models/User";
import { userInfo } from "os";
import SessionManager from "../auth/SessionManager";
import Review from "../models/Review";

/**
 * Controller for handling User CRUD operations.
 * Routes are registered in the `registerRoutes` method.
 * Each method should be called when a request is made to the corresponding route.
 */
export default class UserController {
	private sql: postgres.Sql<any>;

	constructor(sql: postgres.Sql<any>) {
		this.sql = sql;
	}

	registerRoutes(router: Router) {
		router.post("/users", this.createUser);
		// Any routes that include an `:id` parameter should be registered last.
		router.get("/profile", this.goToUserProfile)
		router.get("/updateUsername", this.goToUpdateUsername)
		router.post("/updateUsername", this.updateUsername)
		router.get("/updatePfp", this.goToUpdatePfp)
		router.post("/updatePfp", this.updatePfp)
		router.get("/profile", this.goToUserProfile)

		router.get("/profile/:id", this.goToUserProfile)

	}

	/**
	 * TODO: Upon form submission, this controller method should
	 * validate that no fields are blank/missing, that the passwords
	 * match, and that there isn't already a user with the given email.
	 * If there are any errors, redirect back to the registration form
	 * with an error message.
	 * @param req
	 * @param res
	 */
	createUser = async (req: Request, res: Response) => {
		// If no email is provided, show error
		if (!req.body.email)
		{
			await res.send({
				statusCode: StatusCode.BadRequest,
				redirect: "/register?error=Missing_email",
				message:"Missing email."
			});
			return;
		}
		// If no password is provided, show error
		else if (!req.body.password){
			await res.send({
				statusCode: StatusCode.BadRequest,
				redirect: "/register?error=Missing_Password",
				message:"Missing password."
			});
			return;
		}
		// If passwords don't match, show error
		else if (req.body.confirmPassword != req.body.password){
			await res.send({
				statusCode: StatusCode.BadRequest,
				redirect: "/register?error=Passwords_Mismatch",
				message:"Passwords do not match"
			});
			return;
		}
		// Else, proceed with creating the user
		else{
		  let props: UserProps = {	email: req.body.email,password: req.body.password, createdAt: createUTCDate() };
		  try{
			let user = await User.create(this.sql,props )
			// Successfully created user account, direct to login page
			await res.send({
				statusCode: StatusCode.Created,
				payload: { user: user.props },
				redirect: "/login",
				message: "User created"
			});
		  }
		  catch (error) {
			// If error was thrown because of a duplicate email, show error message
			if (error instanceof DuplicateEmailError){
				await res.send({
					statusCode: StatusCode.BadRequest,
					redirect: "/register?error=Email_InUse",
					message:"User with this email already exists."
				});
				return;
			}

		  }
		  
		}
	};
	goToUserProfile = async (req: Request, res: Response) => 
	{
		let loggedIn: Boolean = this.checkIfLoggedIn(req, res);
		if (loggedIn) {
			let userId = req.session.get("userId")
			let requestedUserId = req.getId()
			if (Number.isNaN(requestedUserId)){
				requestedUserId = userId
			}
			if (userId == requestedUserId){
				let user = await User.getUser(this.sql, userId)
				let reviews = await Review.readUserReviews(this.sql, userId)
				let reviewsCount = reviews?.length;
				let likesCount = 0
				reviews?.forEach((review) => likesCount += review.props.likes )
				await res.send({
					statusCode: StatusCode.OK,
					payload: { user: user.props, reviews: reviews, reviewsCount: reviewsCount, likesReceived: likesCount, loggedIn: true },
					template: "MyAccountView",
					message: "User found"
				});
			}

			else{
				this.goToError(res, "You cannot access a profile that is not yours.")
			}}
		else{
			this.goToLogin(res)
		}

	
	
		
	}
	updateUsername = async (req: Request, res: Response) => 
	{
			let sessionManager: SessionManager = SessionManager.getInstance();
			let sessionId = req.findCookie("session_id")?.value;
			if (sessionId){
				let session = sessionManager.get(sessionId);
				if (session){
					if (session.data["userId"]){
						let userId = session.data["userId"]
						console.log(userId)
						let newUsername = req.body.newUsername
						console.log(newUsername)
						await User.updateUsername(this.sql, userId, newUsername)
						this.goToUserProfile(req,res)
	
					}
	
				}
			}
	}
	updatePfp = async (req: Request, res: Response) => 
		{
				let sessionManager: SessionManager = SessionManager.getInstance();
				let sessionId = req.findCookie("session_id")?.value;
				if (sessionId){
					let session = sessionManager.get(sessionId);
					if (session){
						if (session.data["userId"]){
							let userId = session.data["userId"]
							let newPfp = req.body.newPfp
							await User.updatePfp(this.sql, userId, newPfp)
							this.goToUserProfile(req,res)
		
						}
		
					}
				}
		}
		goToUpdateUsername = async (req: Request, res: Response) => 
		{
			await res.send({
			    statusCode: StatusCode.OK,
				payload: { loggedIn: true },
				template: "ChangeUsernameView",
				message: "Going to change username"
			});

		}
		goToUpdatePfp = async (req: Request, res: Response) => 
			{
				await res.send({
					statusCode: StatusCode.OK,
					payload: { loggedIn: true },
					template: "ChangePfpView",
					message: "Going to change pfp"
				});
	
			}

			goToError = async (res: Response, message: string) => {
				await res.send({
				  statusCode: StatusCode.Forbidden,
				  message: "Unauthorized action.",
				  payload: { error: message },
				  template: "ErrorView",
				});
			  };
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
			
}
