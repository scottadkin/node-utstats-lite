

export const initialNotificationState = {
    "messages": []
};



export function notificationReducer(state, action){

    switch(action.type){
        
        case "add": {
            return {
                ...state,
                "messages": [action.content, ...state.messages]
            };
        }
        case "clear-all": {
            return {
                ...state,
                "messages": []
            }
        }
    }

    return state;
}