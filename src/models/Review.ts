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
    )
    
}