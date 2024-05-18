import postgres from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";

export interface GameTagProps {
	tagId: number;
	gameId: number;
}

export interface TagProps {
	id: number;
	description: string;
}

export default class Tag {
	constructor(
		private sql: postgres.Sql<any>,
		public props: TagProps,
	) {}

	static async readAll(sql: postgres.Sql<any>){
        const connection = await sql.reserve();
    
            const rows = await connection<TagProps[]>`
                SELECT *
                FROM tag t;
            `;
            connection.release();
            
        return rows.map(
            (row) =>
                new Tag(sql, convertToCase(snakeToCamel, row) as TagProps)
        );
    }

	static async addGameTag(sql: postgres.Sql<any>, tag_id: number, game_id: number){
		const connection = await sql.reserve();
			const tags = await connection<TagProps[]>`
				SELECT * FROM gametag 
				WHERE tag_id = ${tag_id} and game_id = ${game_id};
			`;
			if (tags.length == 0){
				await connection<TagProps[]>`
					INSERT INTO gametag(tag_id, game_id)
					VALUES(${tag_id}, ${game_id});
				`;
			}
            connection.release();
        
	}

	static async readTagsForGame(sql: postgres.Sql<any>, gameId: number): Promise<Tag[]> {
		const connection = await sql.reserve();
	
			const rows = await connection<{ description: string }[]>`
				SELECT t.description
				FROM tag t
				JOIN gametag gt ON t.id = gt.tag_id
				WHERE gt.game_id = ${gameId};
			`;
			connection.release();
			
			return rows.map(
				(row) =>
					new Tag(sql, convertToCase(snakeToCamel, row) as TagProps)
			);
	}
}