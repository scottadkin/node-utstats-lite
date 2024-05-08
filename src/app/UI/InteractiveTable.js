"use client"
import { useReducer } from "react";
import TableHeader from "./TableHeader";


function createHeaders(headers, state, dispatch, bNoHeaderSorting){

    const elems = [];


    for(const [name, content] of Object.entries(headers)){

        let mouseOverContent = null;
        let mouseOverTitle = null;

        if(content.mouseOverBox !== undefined){

            mouseOverContent = content.mouseOverBox.content;

            if(content.mouseOverBox.title !== undefined){
                mouseOverTitle = content.mouseOverBox.title;
            }
        }



        elems.push(
            <TableHeader 
                key={name} onClick={() =>{
                    if(bNoHeaderSorting) return;
                    dispatch({"type": "changeSort", "value": name});
                }}
                mouseOverBox={{
                    "content": mouseOverContent,
                    "title": mouseOverTitle
                }}
                >
                
                {content.title}
            </TableHeader>
        );
    }

    return <tr>{elems}</tr>;
}

function createRows(headers, rows){

    const elems = [];

    for(let i = 0; i < rows.length; i++){

        const r = rows[i];

        const columns = [];

        for(const name of Object.keys(headers)){

            const currentClass = r[name]?.className ?? "";

            const onClick = (r[name].onClick !== undefined) ? r[name].onClick : null;

            if(r[name].bIgnoreTD === undefined || !r[name].bIgnoreTD){

                columns.push(<td key={name} className={currentClass} onClick={onClick}>
                    {r[name]?.displayValue ?? r[name]?.value}
                </td>);
                
            }else{

                if(r[name].displayValue !== undefined){
                    columns.push(r[name].displayValue);
                }else{
                    columns.push(r[name].value);
                }
            }
            
        }

        elems.push(<tr key={i}>{columns}</tr>);
    }

    
    if(elems.length === 0){
        elems.push(<tr key="none">
            <td colSpan={Object.keys(headers).length}>No data</td>
        </tr>);
    }

    return elems;
}


function sortRows(rows, sortBy, order){

    order = order.toUpperCase();

    rows.sort((a, b) =>{

        if(a[sortBy] === undefined || b[sortBy] === undefined){

            const keys = Object.keys(a);
            
            if(keys.length === 0){
                throw new Error(`Can't sort by key: ${sortBy}`);
            }else{
                sortBy = keys[0];
                order = "ASC";
            }
        }

        a = a[sortBy].value;
        b = b[sortBy].value;

        const result1 = (order === "ASC") ? -1 : 1;
        const result2 = (order === "ASC") ? 1 : -1;


        if(a < b) return result1;
        if(a > b) return result2;

        return 0;
    });
}

function reducer(state, action){

    switch(action.type){

        case "changeSort": {

            const currentSort = state.sortBy;
            let currentOrder = state.order;

            if(currentSort === action.value){

                if(currentOrder === "ASC"){
                    currentOrder = "DESC";
                }else{
                    currentOrder = "ASC";
                }
            }

            return {
                ...state,
                "sortBy": action.value,
                "order": currentOrder,
               
            }
        }
    }

    return state;
}

export default function InteractiveTable({headers, rows, sortBy, order, width, title, bNoHeaderSorting}){

    const [state, dispatch] = useReducer(reducer, {
        "order": (order !== undefined) ? order.toUpperCase() : "ASC",
        "sortBy": (sortBy !== undefined) ? sortBy : (Object.keys(headers).length > 0) ? Object.keys(headers)[0] : ""
    });

    sortRows(rows, state.sortBy, state.order);

    if(bNoHeaderSorting === undefined) bNoHeaderSorting = false;
    

    let widthClass = "";

    if(width !== undefined){

        width = parseInt(width);
        
        widthClass = `t-width-${width}`;
    }

    const titleElem = (title !== undefined) ? <div className={`table-title center ${widthClass}`}>{title}</div> : null;

    return <div>
        {titleElem}
        <table className={widthClass}>
            <tbody>
                {createHeaders(headers, state, dispatch, bNoHeaderSorting)}
                {createRows(headers, rows)}
            </tbody>
        </table>
    </div>
}