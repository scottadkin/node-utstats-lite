
import styles from "./BasicPagination.module.css";

export default function BasicPagination({results, page, perPage, setPage}){

    let totalPages = 0;

    if(results > 0 && perPage !== 0){

        totalPages = Math.ceil(results / perPage);
    }

    if(totalPages < 2) return null;

    let previousPage = page - 1;
    let nextPage = page + 1;

    if(previousPage < 1) previousPage = 1;
    if(nextPage > totalPages) nextPage = totalPages;
  
    return <div className={styles.wrapper}>
        <div className={styles.button} onClick={() =>{
            if(previousPage === page) return;
            setPage(previousPage);
        }}>Previous</div>
        <div className={styles.info}>Viewing Page {page} of {totalPages}</div>
        <div className={styles.button} onClick={() =>{
            if(nextPage === page) return;
            setPage(nextPage);
        }}>Next</div>
    </div>
}