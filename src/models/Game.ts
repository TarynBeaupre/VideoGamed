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

		const [row] = await connection<GameProps[]>`
			SELECT 1 FROM wishlist_games WHERE user_id = ${userId} AND wishlisted_game_id = ${gameId};
		`;

		if (!row){
			await connection<GameProps[]>`
				INSERT INTO wishlist_games(user_id, wishlisted_game_id)
				VALUES(${userId}, ${gameId});
			`;
		}
		connection.release();
	}

	static async deleteWishlist( sql: postgres.Sql<any>, userId: number, gameId:number ){
		const connection = await sql.reserve();
		await connection<GameProps[]>`
			DELETE FROM wishlist_games WHERE user_id = ${userId} AND wishlisted_game_id = ${gameId};
		`;

		connection.release();
	}

	static async readWishlistGameFromId( sql: postgres.Sql<any>, userId: number, gameId:number ){
		const connection = await sql.reserve();

		const [row] = await connection<GameProps[]>`
			SELECT 1 FROM wishlist_games WHERE user_id = ${userId} AND wishlisted_game_id = ${gameId};
		`;
		connection.release();

		if (!row) {
			return null;
		}
		else {return row;}
	}

	static async readTagDescriptionsForGame(sql: postgres.Sql<any>, gameId: number): Promise<string[]> {
		const connection = await sql.reserve();
	
			const result = await connection<{ description: string }[]>`
				SELECT t.description
				FROM tag t
				JOIN gametag gt ON t.id = gt.tag_id
				WHERE gt.game_id = ${gameId};
			`;
			connection.release();
			
		return result.map(row => row.description);
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

	static async readPlayedList( sql: postgres.Sql<any>, userId: number): Promise<Game[]> 
	{
		const connection = await sql.reserve();

		const rows = await connection<GameProps[]>`
			SELECT G.*
			FROM played_games PG
			JOIN games G ON PG.played_game_id = G.id
			WHERE PG.user_id = ${userId};
		`;

		await connection.release();
		

		return rows.map(
			(row) =>
				new Game(sql, convertToCase(snakeToCamel, row) as GameProps)
		);
	}

	static async addPlayedList( sql: postgres.Sql<any>, userId: number, gameId:number){
		const connection = await sql.reserve();

		const [row] = await connection<GameProps[]>`
			SELECT 1 FROM played_games WHERE user_id = ${userId} AND played_game_id = ${gameId};
		`;

		if (!row) {
			await connection<GameProps[]>`
				INSERT INTO played_games(user_id, played_game_id)
				VALUES(${userId}, ${gameId});
			`;
		}
		connection.release();
	}

	static async deletePlayed( sql: postgres.Sql<any>, userId: number, gameId:number ){
		const connection = await sql.reserve();

		await connection<GameProps[]>`
			DELETE FROM played_games 
			WHERE user_id = ${userId} AND played_game_id = ${gameId};
		`;

		connection.release();
	}

	static async readTop3Recent( sql: postgres.Sql<any> ): Promise<Game[]>
	{
		const connection = await sql.reserve();
		// Changed this query to make sure we only get the games with this user id
		const rows = await connection<GameProps[]>`
			SELECT *
			FROM games
			ORDER BY release_year DESC
			LIMIT 3;
		`;

		await connection.release();
		

		return rows.map(
			(row) =>
				new Game(sql, convertToCase(snakeToCamel, row) as GameProps)
		);
	}
	static async addStars( sql: postgres.Sql<any>, gameId: number, stars: number)
	{
		const connection = await sql.reserve();
		// Changed this query to make sure we only get the games with this user id
		await connection<GameProps[]>`
		UPDATE games SET total_stars = total_stars + ${stars} WHERE id = ${gameId}
		RETURNING *; 
		`;

		await connection.release();
		

	}
	static async getPlayedGame( sql: postgres.Sql<any>, userId: number, gameId: number)
	{
		const connection = await sql.reserve();

		const [row] = await connection<GameProps[]>`
		SELECT * FROM played_games WHERE user_id = ${userId} AND played_game_id = ${gameId};
		`;

		await connection.release();
		
		if (!row){
			return null
		}

		return new Game(sql, convertToCase(snakeToCamel, row) as GameProps)
	
	}



}
