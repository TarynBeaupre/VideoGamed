import postgres from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";

export interface GameProps {
	id?: number;
	title: string;
	description: string;
	cover?: string;
    developer: string;
	releaseYear: number;
    totalStars?: number;
}

export default class Game {
	constructor(
		private sql: postgres.Sql<any>,
		public props: GameProps,
	) {}

    static async read(sql: postgres.Sql<any>, id: number) {
		const connection = await sql.reserve();
		// Changed this query to make sure we only get the todo if it has the right user id
		const [row] = await connection<GameProps[]>`
			SELECT * FROM
			games WHERE id = ${id};
		`;

		await connection.release();
		if (!row) {
			return null;
		}

		return new Game(sql, convertToCase(snakeToCamel, row) as GameProps);
	}

	static async readAll(
		sql: postgres.Sql<any>
	): Promise<Game[]> {
		const connection = await sql.reserve();
		// Changed this query to make sure we only get the games with this user id
		const rows = await connection<GameProps[]>`
			SELECT *
			FROM games;
		`;

		await connection.release();
		

		return rows.map(
			(row) =>
				new Game(sql, convertToCase(snakeToCamel, row) as GameProps)
		);
	}

	static async readWishlist( sql: postgres.Sql<any>, userId: number): Promise<Game[]> 
	{
		const connection = await sql.reserve();

		const rows = await connection<GameProps[]>`
			SELECT G.*
			FROM wishlist_games WG
			JOIN games G ON WG.wishlisted_game_id = G.id
			WHERE WG.user_id = ${userId};
		`;

		await connection.release();
		

		return rows.map(
			(row) =>
				new Game(sql, convertToCase(snakeToCamel, row) as GameProps)
		);
	}

	static async addWishlist( sql: postgres.Sql<any>, userId: number, gameId:number){
		const connection = await sql.reserve();

		await connection<GameProps[]>`
			INSERT INTO wishlist_games(user_id, wishlisted_game_id)
			VALUES(${userId}, ${gameId});
		`;

		connection.release();
	}

	static async removeWishlist(){

	}

	static async readTop3Rated( sql: postgres.Sql<any> ): Promise<Game[]>
	{
		const connection = await sql.reserve();
		// Changed this query to make sure we only get the games with this user id
		const rows = await connection<GameProps[]>`
			SELECT *
			FROM games
			ORDER BY total_stars DESC
			LIMIT 3;
		`;

		await connection.release();
		

		return rows.map(
			(row) =>
				new Game(sql, convertToCase(snakeToCamel, row) as GameProps)
		);
	}


}
