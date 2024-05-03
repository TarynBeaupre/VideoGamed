import postgres from "postgres";
import { camelToSnake, convertToCase, snakeToCamel } from "../utils";

export interface UserProps {
	id?: number;
	email: string;
	password: string;
	createdAt: Date;
	editedAt?: Date;
}

export class DuplicateEmailError extends Error {
	constructor() {
		super("User with this email already exists.");
	}
}

export class InvalidCredentialsError extends Error {
	constructor() {
		super("Invalid credentials.");
	}
}

export default class User {
	constructor(
		private sql: postgres.Sql<any>,
		public props: UserProps,
	) {}

	/**
	 * TODO: Implement this method. It should insert a new
	 * row into the "users" table with the provided props.
	 */
	static async create(
		sql: postgres.Sql<any>,
		props: UserProps,
	): Promise<User> {

		const connection = await sql.reserve();
		// Checking if the email is already in the database
		const [row] = await sql<UserProps[]>`
			SELECT * FROM users 
			WHERE email = ${props.email};
		`;
		// If there was something returned, the email already exists in the database, so throw error
		if (row){
			throw new DuplicateEmailError();}
		// If not, proceed with creating the user
		else{
			await sql<UserProps[]>`
			INSERT INTO users
				${sql(convertToCase(camelToSnake, props))}
			RETURNING *;`;
			await connection.release();
			return new User(sql,props);
		}

	
	}
	/**
	 * TODO: To "log in" a user, we need to check if the
	 * provided email and password match an existing row
	 * in the database. If they do, we return a new User instance.
	 */
	static async login(
		sql: postgres.Sql<any>,
		email: string,
		password: string,
	): Promise<User> {

		const connection = await sql.reserve();
		// Checking if there's a user in the database with corresponding email and password 
		const [row] = await connection<UserProps[]>`
			SELECT * FROM
			users WHERE email = ${email} AND password = ${password};
		`;

		// If not, throw an error
		if (!row) {
			throw new InvalidCredentialsError();
		}
		// Else, return the new user
		return new User(sql, convertToCase(snakeToCamel, row) as UserProps);
	}


	

	
}
