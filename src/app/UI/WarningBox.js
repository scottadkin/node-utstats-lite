export default function WarningBox({children}){

    if(children === null) return null;

    return <div className="warning">
        <div className="warning-title">Warning</div>
        {children}
    </div>
}