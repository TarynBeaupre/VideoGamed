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
	tagId: number;
	description: string;
}

export default class Tag {
	constructor(
		private sql: postgres.Sql<any>,
		public props: TagProps,
	) {}

	static async readAll(sql: postgres.Sql<any>){
        const connection = await sql.reserve();
    
            const rows = await connection<{ description: string }[]>`
                SELECT t.description
                FROM tag t;
            `;
            connection.release();
            
        return rows.map(
            (row) =>
                new Tag(sql, convertToCase(snakeToCamel, row) as TagProps)
        );
    }
}