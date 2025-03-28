import User from '../models/User.js';
import { signToken, AuthenticationError } from '../services/auth.js'

interface Book{
    bookId: string;
    authors: string[];
    description: string;
    title: string;
    image: string;
    link: string;
}

interface User {
    _id: string;
    username: string;
    email: string;
    bookCount: number;
    savedBooks: Book[];
}

interface Context{
    user?: User;
}

interface UserArgs{
    username: string;
    email: string;
    password: string;
}

interface AddBookArgs {
    input:{
        bookId: string;
        authors: string[];
        description: string;
        title: string;
        image: string;
        link: string; 
    }
}

interface RemoveBookArgs {
    bookId: string;
}

const resolvers = {
    Query: {
        me: async(_parent: any, _args: any, context: Context): Promise<User | null> => {
            if(context.user){
                return await User.findOne({ _id: context.user._id});
            }
            throw AuthenticationError;
        }
    },
    Mutation: {
        addUser: async(_parent: any, { username, email, password }: UserArgs):Promise<{ token: string; user: User }> => {
            const user = await User.create({username,email,password}) as User;
            const token = signToken(user.username, user.email, user._id);
            return {token, user}
        },
        login: async(_parent: any, {email, password}: {email: string, password: string}): Promise<{ token: string; userOut: User }> =>{
            const user = await User.findOne({email});
            if (!user) {
                throw AuthenticationError;
            }
            const correctPw = await user.isCorrectPassword(password);
            if(!correctPw){
                throw AuthenticationError;
            }
            const token = signToken(user.username, user.email, user._id);
            const userOut = user as User;
            return { token, userOut }
        },
        saveBook: async(_parent: any, { input }: AddBookArgs, context: Context):Promise<User | null> =>{
            if (context.user){
                return await User.findOneAndUpdate(
                    {_id: context.user._id},
                    {
                     $addToSet: {savedBooks: {...input}}
                    },
                    {
                        new: true,
                        runValidators: true
                    }
                );
            }
            throw AuthenticationError;
        },
        removeBook:async (_parent: any, {bookId}: RemoveBookArgs, context:Context):Promise<User | null> =>{
            if(context.user){
                return await User.findOneAndUpdate(
                    {_id: context.user._id},
                    {$pull: {savedBooks: {bookId: bookId}}},
                    {new: true}
                )
            }
            throw AuthenticationError;
        }
    }
}

export default resolvers;