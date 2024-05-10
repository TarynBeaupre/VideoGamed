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
	static async readTop3Rated(
		sql: postgres.Sql<any>
	): Promise<Game[]> {
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
