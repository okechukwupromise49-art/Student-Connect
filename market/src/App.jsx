
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
import MarketHome from './component/MarketHome'
import MarketRegister from './component/MarketRegister'
import { SellItem } from './component/SellItem'
import CartPage from './page/Cart'
import OrdersPage from './page/Order'
import MarketYou from './page/MarketYou'
import MarketItem from './component/Item'



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
           <Route path="/market" element={<MarketHome/>}/>
           <Route path="/market/reg" element={<MarketRegister/>}/>
           <Route path="/market/sell" element={<SellItem/>}/>
           <Route path="/market/cart" element={<CartPage/>}/>
           <Route path="/market/orders" element={<OrdersPage/>}/>
           <Route path="/market/you" element={<MarketYou/>}/>
           <Route path="/market/item/:id" element={<MarketItem />} />
        </Routes>
     
    </div>
  )
}

export default App
