import Game, { GameProps } from "../models/Game";
import Review, { ReviewProps } from "../models/Review";
import Tag, {TagProps} from "../models/Tag";
import postgres from "postgres";
import Request from "../router/Request";
import Response, { StatusCode } from "../router/Response";
import Router from "../router/Router";
import { createUTCDate } from "../utils";
import SessionManager from "../auth/SessionManager";
import Session from "../auth/SessionManager";
import Cookie from "../auth/Cookie";
import User, { InvalidCredentialsError } from "../models/User";

export default class GameController {
    private sql: postgres.Sql<any>;
  
    constructor(sql: postgres.Sql<any>) {
      this.sql = sql;
    }
  
    /**
     * To register a route, call the corresponding method on
     * the router instance based on the HTTP method of the route.
     *
     * @param router Router instance to register routes on.
     *
     * @example router.get("/games", this.getGamesList);
     */
    registerRoutes(router: Router) {
      
      // Any routes that include an `:id` parameter should be registered last.
    }
   
}
