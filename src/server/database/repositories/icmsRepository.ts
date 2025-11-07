import { AppDataSource } from "../data-source";
import { ICMS } from "../entities";

export const icmsRepository = AppDataSource.getRepository(ICMS);