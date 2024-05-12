import postgres from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";

export interface ReviewPropsWithPicture {
	id?: number;
    userId: number;
    userPfp: string;
	title: string;
    likes: number;
	text: string;
    stars: number;
    reviewedGameId: number;
}

export interface ReviewProps {
	id?: number;
    userId: number;
	title: string;
    likes: number;
	text: string;
    stars: number;
    reviewedGameId: number;
}

export default class Review{
    constructor (
        private sql: postgres.Sql<any>,
        public props: ReviewProps
    ) {}

    //gets 1 review for a specific user (to edit/ check if exists)
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

    //gets ALL reviews for a specific game!
    static async readGameReviews(
        sql: postgres.Sql<any>, game_id:number
    ): Promise<Review[]> {
        const connection = await sql.reserve();
        const rows = await connection<ReviewPropsWithPicture[]>`
        SELECT reviews.*, users.pfp AS user_pfp
        FROM reviews
        INNER JOIN users ON reviews.user_id = users.id
        WHERE reviews.reviewed_game_id=${game_id};`;
        await connection.release();
        return rows.map (
            (row) => new Review(sql, convertToCase(snakeToCamel, row) as ReviewPropsWithPicture)
        );
    }
    static async addReviewLike(
        sql: postgres.Sql<any>, game_id:number
    ){
        const connection = await sql.reserve();
        try{
            const [row] = await connection<ReviewProps[]>`
            UPDATE reviews SET likes = likes+1 WHERE id = ${game_id}
            RETURNING *;
            `;           
            await connection.release();
            if (!row){
            return null;
            }
            return new Review(sql, convertToCase(snakeToCamel, row) as ReviewProps);
        }
        catch{
            console.log(game_id)
            return null;
        }

    }

}