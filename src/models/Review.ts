import postgres from "postgres";
import {
	camelToSnake,
	convertToCase,
	createUTCDate,
	snakeToCamel,
} from "../utils";
import { a } from "vitest/dist/suite-a18diDsI";

export interface ReviewPropsWithPicture {
	id?: number;
    userId: number;
    userPfp: string;
	title: string;
    likes: number;
	review: string;
    stars: number;
    reviewedGameId: number;
}

export interface ReviewProps {
	id?: number;
    userId: number;
	title: string;
    likes: number;
	review: string;
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

    static async getSpecificReviewWithId(sql: postgres.Sql<any>, review_id:number){
        const connection = await sql.reserve();
        const [row] = await connection<ReviewProps[]>`
        SELECT * FROM
        reviews where id = ${review_id};
        `;

        await connection.release();
        if (!row){
            return null;
        }

        return new Review(sql, convertToCase(snakeToCamel, row) as ReviewProps);
    }       

    static async getSpecificReview(sql: postgres.Sql<any>, user_id:number, game_id: number){
        const connection = await sql.reserve();
        const [row] = await connection<ReviewProps[]>`
        SELECT * FROM
        reviews where user_id = ${user_id} and reviewed_game_id = ${game_id};
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
        SELECT reviews.*, users.pfp AS user_pfp, users.username as username
        FROM reviews
        INNER JOIN users ON reviews.user_id = users.id
        WHERE reviews.reviewed_game_id=${game_id};`;
        await connection.release();
        return rows.map (
            (row) => new Review(sql, convertToCase(snakeToCamel, row) as ReviewPropsWithPicture)
        );
    }

    static async readAverageStar(sql: postgres.Sql<any>, game_id:number): Promise<number> {
        const connection = await sql.reserve();
        
        const rows = await connection<{sum: number, count: number}[]>`
        SELECT SUM(stars) as sum, COUNT(*) as count
        FROM reviews WHERE reviewed_game_id = ${game_id};`;
        await connection.release();

        const sumOfStars = rows.length > 0 && rows[0].sum !== null ? rows[0].sum : 0;
        const numberOfReviews = rows.length > 0 ? rows[0].count : 0;

        const averageRating = numberOfReviews > 0 ? sumOfStars / numberOfReviews : 0;
        return parseFloat(averageRating.toFixed(1));
    }


    static async addReviewLike(
        sql: postgres.Sql<any>, review_id: number, user_id: number
    ){
        const connection = await sql.reserve();
        try{
            const alreadyLiked = await connection<ReviewProps[]>`
                SELECT * FROM liked_review WHERE user_id = ${user_id} AND
                review_id = ${review_id};
            `;
            if (alreadyLiked.length == 0){
                await connection<ReviewProps[]>`
                    INSERT INTO liked_review(user_id, review_id)
                    VALUES(${user_id}, ${review_id});
                `;

                const [row] = await connection<ReviewProps[]>`
                UPDATE reviews SET likes = likes+1 WHERE id = ${review_id}
                RETURNING *;
                `;
    
                await connection.release();
                
            }
            else {
                return;
            }
        }
        catch{
            return null;
        }

    }
    static async create(
		sql: postgres.Sql<any>,
		props: ReviewProps,
	) {

		const connection = await sql.reserve();

        const [row] = await sql<ReviewProps[]>`
			INSERT INTO reviews
				${sql(convertToCase(camelToSnake, props))}
			RETURNING *;`;
			await connection.release();
        
            if (!row){
                return null
            }
		
        return new Review(sql, convertToCase(snakeToCamel, row) as ReviewProps)

	
	}
    static async readUserReviews(sql: postgres.Sql<any>, userId:number){
        const connection = await sql.reserve();
        const rows = await connection<ReviewPropsWithPicture[]>`
        SELECT reviews.*, users.pfp AS user_pfp
        FROM reviews
        INNER JOIN users ON reviews.user_id = users.id
        WHERE reviews.user_id=${userId};`;
        
        await connection.release();
        if (!rows){
            return null;
        }
        return rows.map (
            (row) => new Review(sql, convertToCase(snakeToCamel, row) as ReviewPropsWithPicture)
        );
    }       

    static async readTop3Liked(sql: postgres.Sql<any>){
        const connection = await sql.reserve();
        const rows = await connection<ReviewPropsWithPicture[]>`
        SELECT reviews.*, users.pfp AS user_pfp, users.username as username
        FROM reviews
        INNER JOIN users ON reviews.user_id = users.id
        ORDER BY likes DESC
        LIMIT 3`;

        await connection.release();
        if (!rows){
            return null;
        }

        return rows.map (
            (row) => new Review(sql, convertToCase(snakeToCamel, row) as ReviewPropsWithPicture)
        );;
    }     

}