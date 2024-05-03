import Game, { GameProps } from "../models/Game";
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
		router.get("/todos/new", this.getNewTodoForm);
		router.post("/todos", this.createTodo);
		

		// Any routes that include an `:id` parameter should be registered last.
		router.get("/todos/:id/edit", this.getEditTodoForm);
		router.get("/todos/:id", this.getTodo);
		router.put("/todos/:id", this.updateTodo);
		router.delete("/todos/:id", this.deleteTodo);
		router.put("/todos/:id/complete", this.completeTodo);
	}

	getNewTodoForm = async (req: Request, res: Response) => {
		if (this.checkIfLoggedIn(req,res)){
			await res.send({
				statusCode: StatusCode.OK,
				message: "New todo form",
				template: "NewFormView",
				payload: { title: "New Todo", loggedIn: true },
			});
		}
	};

	getEditTodoForm = async (req: Request, res: Response) => {
		if (this.checkIfLoggedIn(req,res)){
		const id = req.getId();
		let todo: Todo | null = null;
		todo = await Todo.read(this.sql, id, req.session.get("userId"));
		if (!todo){
			this.goToError(res)
		    return;
		}
		await res.send({
			statusCode: StatusCode.OK,
			message: "Edit todo form",
			template: "EditFormView",
			payload: { todo: todo?.props, title: "Edit Todo", loggedIn: true, todoId: id },
		});
		return;
		
		}		
	};

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

		await res.send({
			statusCode: StatusCode.OK,
			message: "Game list retrieved",
			payload: {
				title: "Game List",
				games: gamesList,
				loggedIn: true
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
	getTodo = async (req: Request, res: Response) => {
		if (this.checkIfLoggedIn(req,res)){
			const id = req.getId();
			let todo: Todo | null = null;
	
			todo = await Todo.read(this.sql, id, req.session.get("userId"));
			if (!todo){
				this.goToError(res)
				return;
			}
			
 
			await res.send({
				statusCode: StatusCode.OK,
				message: "Todo retrieved",
				template: "ShowView",
				payload: {
					todo: todo?.props,
					title: todo?.props.title,
					isComplete: todo?.props.status === "complete",
					loggedIn: true,
					todoId: id
				},
			});
		}
		
	};

	/**
	 * This method should be called when a POST request is made to /todos.
	 * It should create a new todo in the database and send it as a response.
	 *
	 * @param req The request object.
	 * @param res The response object.
	 *
	 * @example POST /todos { "title": "New Todo", "description": "A new todo" }
	 */
	createTodo = async (req: Request, res: Response) => {
		if (this.checkIfLoggedIn(req,res)){
		let todo: Todo | null = null;


		let todoProps: TodoProps = {
			title: req.body.title,
			userId: req.session.data["userId"],
			description: req.body.description,
			status: "incomplete",
			createdAt: createUTCDate(),
		};

		try {
			todo = await Todo.create(this.sql, todoProps);
		} catch (error) {
			console.error("Error while creating todo:", error);
		}

		await res.send({
			statusCode: StatusCode.Created,
			message: "Todo created successfully!",
			payload: { todo: todo?.props, loggedIn: true, todoId: todo?.props.id },
			redirect: `/todos/${todo?.props.id}`,
		});}
	};

	/**
	 * This method should be called when a PUT request is made to /todos/:id.
	 * It should update an existing todo in the database and send it as a response.
	 *
	 * @param req The request object.
	 * @param res The response object.
	 *
	 * @example PUT /todos/1 { "title": "Updated title" }
	 * @example PUT /todos/1 { "description": "Updated description" }
	 * @example PUT /todos/1 { "title": "Updated title", "dueAt": "2022-12-31" }
	 */
	updateTodo = async (req: Request, res: Response) => {
		if (this.checkIfLoggedIn(req,res)){
		const id = req.getId();
		const todoProps: Partial<TodoProps> = {};

		if (req.body.title) {
			todoProps.title = req.body.title;
		}

		if (req.body.description) {
			todoProps.description = req.body.description;
		}
		let todo: Todo | null = null;
		todo = await Todo.read(this.sql, id, req.session.get("userId"));
		if (!todo){
			this.goToError(res)
			return;
		}
		try {
			await todo?.update(todoProps);
		} catch (error) {
			console.error("Error while updating todo:", error);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Todo updated successfully!",
			payload: { todo: todo?.props, loggedIn: true, todoId: id },
			redirect: `/todos/${id}`,
		});
		}
	};

	/**
	 * This method should be called when a DELETE request is made to /todos/:id.
	 * It should delete an existing todo from the database.
	 *
	 * @param req The request object.
	 * @param res The response object.
	 *
	 * @example DELETE /todos/1
	 */
	deleteTodo = async (req: Request, res: Response) => {
		if (this.checkIfLoggedIn(req,res)){
		const id = req.getId();
		let todo: Todo | null = null;
		todo = await Todo.read(this.sql, id, req.session.get("userId"));
		if (!todo){
			this.goToError(res)
			return;
		}

		try {
			await todo?.delete();
		} catch (error) {
			console.error("Error while deleting todo:", error);
		}

		await res.send({
			statusCode: StatusCode.OK,
			message: "Todo deleted successfully!",
			payload: { todo: todo?.props, loggedIn: true, todoId: id },
			redirect: "/todos",
		});}
	};

	/**
	 * This method should be called when a PUT request is made to /todos/:id/complete.
	 * It should mark an existing todo as complete in the database and send it as a response.
	 *
	 * @param req The request object.
	 * @param res The response object.
	 *
	 * @example PUT /todos/1/complete
	 */
	completeTodo = async (req: Request, res: Response) => {
		if (this.checkIfLoggedIn(req,res)){
			const id = req.getId();
			let todo: Todo | null = null;
			todo = await Todo.read(this.sql, id, req.session.get("userId"));
			if (!todo){
				this.goToError(res)
				return;
			}
			try {
				await todo?.markComplete();
			} catch (error) {
				console.error("Error while marking todo as complete:", error);
			}
	
			await res.send({
				statusCode: StatusCode.OK,
				message: "Todo marked as complete!",
				payload: { todo: todo?.props, loggedIn: true, todoId: id  },
				redirect: `/todos/${id}`,
			});
		}
		
	
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
		this.goToLogin(res);
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
