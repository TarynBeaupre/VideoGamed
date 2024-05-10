import postgres from "postgres";
import Request from "../router/Request";
import Router from "../router/Router";
import Response, { StatusCode }  from "../router/Response";
import User, { UserProps } from "../models/User";
import { createUTCDate } from "../utils";
import { DuplicateEmailError } from "../models/User";
import { userInfo } from "os";

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
}
