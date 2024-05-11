import postgres from "postgres";
import Router from "../router/Router";
import Request from "../router/Request";
import Response, { StatusCode }  from "../router/Response";
import { error } from "console";
import {  InvalidCredentialsError } from "../models/User";
import User, { UserProps } from "../models/User";
import Session from "../auth/Session";
import Cookie from "../auth/Cookie";
import SessionManager from "../auth/SessionManager";


export default class AuthController {
	private sql: postgres.Sql<any>;

	constructor(sql: postgres.Sql<any>) {
		this.sql = sql;
	}

	registerRoutes(router: Router) {
		router.get("/register", this.getRegistrationForm);
		router.get("/login", this.getLoginForm);
		router.post("/login", this.login);
		router.get("/logout", this.logout);
	}

	/**
	 * TODO: Render the registration form.
	 */
	getRegistrationForm = async (req: Request, res: Response) => {
		if (req.getSearchParams().has("error")){
			let error = req.getSearchParams().get("error");
			if (error == "Missing_Password"){
				await res.send({
					statusCode: StatusCode.OK,
					message: "Missing password.",
					payload: { error: "Password is required." },
					template: "RegisterView",
				});
			}
			else if (error == "Missing_email"){
				await res.send({
					statusCode: StatusCode.OK,
					message: "Missing email.",
					payload: { error: "Email is required." },
					template: "RegisterView",
				});
			}
			else if (error == "Passwords_Mismatch"){
				await res.send({
					statusCode: StatusCode.OK,
					message: "Passwords do not match.",
					payload: { error: "Passwords do not match" },
					template: "RegisterView",
				});
			}
			else if (error == "Email_InUse"){
				await res.send({
					statusCode: StatusCode.OK,
					message: "Duplicate email",
					payload: { error: "User with this email already exists." },
					template: "RegisterView",
				});
			}
			
		}
		else{
			await res.send({
				statusCode: StatusCode.OK,
				message: "Going to registration form",
				template: "RegisterView",
			});
		}

	};
	

	/**
	 * TODO: Render the login form.
	 */
	getLoginForm = async (req: Request, res: Response) => {

		res.setCookie(new Cookie("session-id",req.session.id))

		if (req.getSearchParams().has("error")){
			let error = req.getSearchParams().get("error");
			if (error == "Missing_Password"){
				await res.send({
					statusCode: StatusCode.OK,
					message: "Missing password.",
					payload: { error: "Password is required." },
					template: "Login",
				});
			}
			else if (error == "Missing_Email"){
				await res.send({
					statusCode: StatusCode.OK,
					message: "Missing email.",
					payload: { error: "Email is required." },
					template: "LoginView",
				});
			}
			else if (error == "Invalid_Credentials"){
				await res.send({
					statusCode: StatusCode.OK,
					message: "Invalid credentials.",
					payload: { error: "Invalid credentials."},
					template: "LoginView",
				});
			}
			else if (error == "Action_Forbidden"){
				await res.send({
					statusCode: StatusCode.OK,
					message: "Action forbidden.",
					payload: { error: "Please login first."},
					template: "LogLoginView",
				});
			}
			else if (error == "User_Created"){
				await res.send({
					statusCode: StatusCode.OK,
					message: "Successfully created account, log in necessary.",
					payload: { error: "Successfully created your account! Please login."},
					template: "LoginView",
				});
			}
		}
		else{

			if (req.findCookie("rememberMe")){	
				let rememberedEmail = req.findCookie("rememberMe")?.value;
				req.findCookie("rememberMe")?.setExpires(0)
				await res.send({
					statusCode: StatusCode.OK,
					message: "Going to login form with remembered email",
					payload: {remember: rememberedEmail },
					template: "LoginView",
				});
				
			}
			else{
				await res.send({
					statusCode: StatusCode.OK,
					message: "Going to login form",
					template: "LoginView",
				});
			}
		}

	};

	/**
	 * TODO: Handle login form submission.
	 */
	login = async (req: Request, res: Response) => {
		if (!req.body.email){
			if (!req.findCookie("remember")?.value){
				await res.send({
					statusCode: StatusCode.BadRequest,
					redirect: "/login?error=Missing_Email",
					message:"Missing email."
				});
				return;
			}
			req.body.email = req.findCookie("remember")?.value	
		
		}
		else if (!req.body.password){
			await res.send({
				statusCode: StatusCode.BadRequest,
				redirect: "/login?error=Missing_Password",
				message:"Missing password."
			});
			return;
		}
		try
			{
					let user: User = await User.login(this.sql, req.body.email, req.body.password)

					if (req.body.remember == "on"){
						let rememberMeCookie: Cookie = new Cookie("rememberMe",req.body.email)
						res.setCookie(rememberMeCookie)
					}
					
					let sessionManager: SessionManager = SessionManager.getInstance()
					let session: Session = sessionManager.createSession();
					session.data["userId"] = user.props.id
					res.setCookie(session.cookie);
					res.setCookie(new Cookie("email",req.body.email))
					await res.send({
						statusCode: StatusCode.OK,
						redirect: "/home",
						message:"Logged in successfully!",
						payload: {user: user.props}
					});
		
			}
			catch (error){
				if (error instanceof InvalidCredentialsError){
					await res.send({
						statusCode: StatusCode.BadRequest,
						redirect: "/login?error=Invalid_Credentials",
						message:"Invalid credentials."
					});
					return;
				}

			}

		
		
	

	};

	/**
	 * TODO: Handle logout.
	 */
	logout = async (req: Request, res: Response) => {
		let session = req.getSession();
		session.destroy();
		await res.send({
			statusCode: StatusCode.OK,
			redirect: "/",
			message:"Succesfully logged out"
		});
	};

}
