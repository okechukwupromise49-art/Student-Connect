import { Footer } from "../component/Footer";
import { Header } from "../component/Header";
import PostFeed from "../component/PostFeed";
import { Welcome } from "../component/Welcome";

export function Homepage(){
    return(
        <div>
            <Header/>
            
            <Welcome/>
            <main className="mb-20">
                <PostFeed />
            </main>

         <Footer/>
            
        </div>
    )
}