import postgres from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";

export interface ReviewProps {
	id?: number;
    user_id: number;
	title: string;
    likes: number;
	text: string;
    stars: number;
    reviewed_game_id: number;
}

export default class Review{
    constructor (
        private sql: postgres.Sql<any>,
        public props: ReviewProps
    ) {}

    static async read(sql: postgres.Sql<any>, id:number){
        const connection = await sql.reserve();
        const [row] = await connection<ReviewProps[]>`
        SELECT * FROM
        reviews where id=${id};
        `;

        await connection.release();
        if (!row){
            return null;
        }

        return new Review(sql, convertToCase(snakeToCamel, row) as ReviewProps);
    }       

    static async readAll(
        sql: postgres.Sql<any>
    ): Promise<Review[]> {
        const connection = await sql.reserve();
        const rows = await connection<ReviewProps[]>`
        SELECT * FROM reviews;`;

        await connection.release();
        return rows.map (
            (row) => new Review(sql, convertToCase(snakeToCamel, row) as ReviewProps)
        );
    }

}