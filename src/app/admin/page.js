import ErrorBox from "../UI/ErrorBox";
import Header from "../UI/Header";
import { getSessionInfo  } from "../lib/authentication";
import AdminMain from "../UI/admin/AdminMain";

export default async function AdminPage({params, searchParams}){

    const sessionInfo = await getSessionInfo();

    if(sessionInfo === null){

        return <div>
            <Header>Admin Control Panel</Header>
            <ErrorBox title="Access Denied">You are not logged in</ErrorBox>
        </div>
    }

    if(sessionInfo === null){

        return <div>
            <Header>Admin Control Panel</Header>
            <ErrorBox title="Access Denied">You do not have the required permissions.</ErrorBox>
        </div>
    }

    return <div>
        <Header>Admin Control Panel</Header>
        <AdminMain />
    </div>
}