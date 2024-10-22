"use client"

export default function useLocalStorage(){

    if(typeof localStorage === "undefined") return {"setItem": () =>{}, "getItem": () =>{ return undefined;}};

    //localStorage.clear();
    return {
        "setItem": (key, value) =>{

            localStorage.setItem(key, JSON.stringify(value));
        },
        "getItem": (key) =>{

            const data = localStorage.getItem(key);

            if(data === null) return null;

            return JSON.parse(data);
        }
    };
}