export default function Loading({value, children}){

    if(!value) return null;

    return <div className="loading">
        {children}
    </div>
}