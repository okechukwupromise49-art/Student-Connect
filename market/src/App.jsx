
import { Route, Routes } from 'react-router-dom'
import './App.css'
import { Homepage } from './page/Homepage'
import { LogIn } from 'lucide-react'
import { Login } from './page/Login'
import Profile from './page/Profile'
import { EditProfile } from './page/editProfile'
import CreatePost from './page/Post'
import FindFriends from './page/FindFriends'
import DisplayNot from './component/DisplayNot'



function App() {
 

  return (
    <div>
        <Routes>
           <Route path="/" element={<Login/>}/>
           <Route path="/homepage" element={<Homepage/>}/>
           <Route path="/profile/:id" element={<Profile/>}/>
           <Route path="/editProfile" element={<EditProfile/>}/>
           <Route path="/create" element={<CreatePost/>}/>
           <Route path="/find" element={<FindFriends/>}/>
           <Route path="/alert" element={<DisplayNot/>}/>
        </Routes>
     
    </div>
  )
}

export default App
