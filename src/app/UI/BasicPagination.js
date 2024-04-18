export default function BasicPagination({results, page, perPage}){

    let totalPages = 0;
  
    return <>
        <div className="small-info">Found {results} Matches<br/>Viewing Page {page} of {totalPages}</div>
        <div>Previous</div>
        <div>Next</div>
    </>
}