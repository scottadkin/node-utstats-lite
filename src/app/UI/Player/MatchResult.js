"use client"


export default function matchResult({playerId, data}){

    let result = "";

    let bWinner = false;
    let bDraw = false;

    if(data.total_teams < 2){

        if(data.solo_winner === playerId){
            bWinner = true;
        }

    }else{

        const teamScores = [
            {"team": 0, "score": data.team_0_score},
            {"team": 1, "score": data.team_1_score},
            {"team": 2, "score": data.team_2_score},
            {"team": 3, "score": data.team_3_score},
        ];

        teamScores.sort((a, b) =>{

            a = a.score;
            b = b.score;

            if(a > b) return -1;
            if(a < b) return 1;

            return 0;
        });


        const winnerScore = teamScores[0].score;

        for(let i = 0; i < teamScores.length; i++){

            const t = teamScores[i];

            if(t.team === data.team){

                if(i === 0){
                    bWinner = true;
                }else{

                    if(t.score === winnerScore){
                        bWinner = false;
                        bDraw = true;
                    }else{
                        break;
                    }
                }
            }
        }
    }

    if(bWinner){
        result = <span className="green-font">Winner</span>
    }else{

        if(bDraw){
            <span className="yellow-font">Draw</span>
        }else{
            result = <span className="red-font">Loser</span>
        }
    }

 
    return <div>
        {result}
    </div>
}