"use client"


export default function matchResult({playerId, data}){

    let result = "";

    let bWinner = false;
    //total amount of teams on the winners score
    let totalWinners = 0;


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

            if(t.score === winnerScore){

                totalWinners++;

                if(t.team === data.team) bWinner = true;      
            }
        }
    }

    if(bWinner && totalWinners === 1){
        result = <span className="green-font">Winner</span>

    }else if(bWinner && totalWinners > 1){
        result = <span className="yellow-font">Draw</span>
    }else{
        result = <span className="red-font">Loser</span>
    }
    
    return <div>
        {result}
    </div>
}