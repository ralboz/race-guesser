import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
    const user = await currentUser();

    return (
        <div>
            <main className="max-w-7xl mx-auto px-4 py-4">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                    Welcome to F1 Predictor
                </h1>

                {user ? (
                    <div className="flex items-center gap-4 mb-8 flex-wrap">
                        <p className="text-xl">Welcome back, {user.firstName}!</p>
                        <div>
                            <Link href="/groups" className="bg-[#2C40BD] h-8 px-6 py-2 rounded-xl flex items-center justify-center text-lg mx-auto w-fit">
                                Go to My Group
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-4 mb-8 flex-wrap">
                        <p className="text-xl">
                            To quickly get started create an account here
                        </p>
                        <Link href="/sign-in" className="bg-[#2C40BD] h-8 px-6 py-2 rounded-xl flex items-center justify-center text-lg w-fit">Get started</Link>
                    </div>
                )}

                <div className="flex flex-col mt-8">
                    <h2 className="text-2xl">How it works?</h2>
                    <p className="text-lg opacity-80">
                        F1 predictions allows you to setup a fun guessing league with your friends or colleagues for the upcoming f1 races! Once you create an account, you can start by creating a league. You can then share your league link with who ever you want to join and the predictions fun begins!
                    </p>
                </div>
                <div className="flex flex-col mt-8 mb-10">
                    <h2 className="text-2xl">Points system:</h2>
                    <p className="text-lg opacity-80">The points systems works as follows: 2 points for an exact guess, 1 point for one position off. So for example if you predict: 1: Verstappen | 2: Hamilton | 3: Alonso<br /><br />If the actual result comes: <br /> 1: Hamilton | 2: Antonelli | 3: Alonso<br /><br />You would get 0 points for your Verstappen guess, 1 point for you Hamilton guess, and 2 points for your Alonso guess. Well done you just scored 3 points!</p>
                    <p className="text-lg opacity-80"><br/>For the actual prediction game you will guess the top 10 scoring positions. The person in your prediction group with the most points at the chequered flag in Abu Dhabi will be crowned this seasons prediction champion!</p>
                </div>
            </main>
        </div>
    );
}
