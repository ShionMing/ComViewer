import SearchBar from "@/components/SearchBar.tsx";


export default function NavBar() {
    return (
        <div className="w-full p-2 bg-hex-f4f4f5 border-1 border-hex-d4d4d8 flex flex-col justify-center items-center"
             style={{height: "10%"}}>
            <SearchBar/>
        </div>
    );
}