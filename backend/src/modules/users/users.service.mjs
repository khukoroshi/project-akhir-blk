import User from "./users.model.mjs";

export const isEmailTaken = (email) => User.emailExists(email);
export const findUserByEmail = (email) => User.findByEmail(email);
export const createUser = (data) => User.create(data);
