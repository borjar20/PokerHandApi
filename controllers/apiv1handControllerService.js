'use strict'
//

module.exports.addHand = function addHand(req, res, next) {


  let resultados = [];

  let boteAcum = 0;
  req.pokerhand.value.forEach((game) => {
    let {bote,jugadas} = game;

    if(calcTrickedDeck(jugadas)){
      return resultados.push("Partida amañada")
    }

    const handsRanks = []
    let money = parseFloat(bote) + boteAcum;
    boteAcum = 0;
    
    jugadas.forEach((player) => {

      money += player.apuesta;
      let hand = player.cartas;
      handsRanks.push(calcHandRank(hand));
    })
    
    console.log(handsRanks);

    let handsOrdered = [...handsRanks];
    handsOrdered.sort((a,b)=>compareHands(a,b));
    if(compareHands(handsOrdered[0],handsOrdered[1]) == 0){
      boteAcum = money;
      return resultados.push("Iguales.");
    }
    
    const winner = jugadas[handsRanks.indexOf(handsOrdered[0])];
    return resultados.push(`${winner.jugador} gana ${money}`)
  })

  res.send({
    resultados
  });
};

function calcCardValueInMatrix(card){

  // Card matrix
  // X  2  3  4  5  6  7  8  9  10  J  Q  K  A
  // C  01 02 03 04 05 06 07 08 09 10 11 12 13
  // D  14 15 16 17 18 19 20 21 22 23 24 25 26
  // H  27 28 29 30 31 32 33 34 35 36 37 38 39
  // S  40 41 42 43 44 45 46 47 48 49 50 51 52

  let {valor,palo} = card
  let numValue = 0;

  switch (valor) {
      case "J":
          numValue = 10;
          break;
      case "Q":
          numValue = 11;
          break;
      case "K":
          numValue = 12;
          break;
      case "A":
          numValue = 13;
          break;
      default:
          numValue = parseInt(valor)-1;
          break;
  }
  let offset = 0;

  switch (palo) {
      case "C":
          offset = 0;
          break;
      case "D":
          offset = 1;
          break;
      case "H":
          offset = 2;
          break;
      case "S":
          offset = 3;
          break;
      default:
          break;
  }

  return numValue + 13*offset;
};

function calcHandRank(hand){
  
  let suits = Array(4).fill(0)
  let values = Array(13).fill(0);

  hand.forEach((card) => {
    let valueInMatix = calcCardValueInMatrix(card);

    suits[Math.floor((valueInMatix-1)/13)] += 1
    values[(valueInMatix-1)%13] += 1
  });

  let indexRank = [];


  //find the first card value in the hand
  let firstValue = values.findIndex((value) => value === 1);

  //subarray of 5 card that can make a straight
  let straightCards = values.slice(firstValue,firstValue+5)
  let straight = straightCards.filter((value) => value === 1).length === 5;

  //since lowStraignt start with Ace this subarray is 1 element less
  straightCards.pop()
  let lowStraight = straightCards.filter((value) => value === 1).length === 4 && values[12] === 1;
  let color = suits.some((suit) => suit === 5);

  if(lowStraight){
    firstValue-=1
  }

  //Color and straight verification
  if((straight || lowStraight) && color){
    indexRank.push({index:firstValue,value:9})
  }

  if(color){
    indexRank.push({index:values.lastIndexOf(1),value:6})
  }else if(straight || lowStraight){
    indexRank.push({index:firstValue,value:5})
  }

  // The basics
  values.forEach((value,index) => {

    //find poker
    if(value == 4){
      indexRank.push({index,value:8})
      return true 
    }

    //find trips
    if(value == 3){
      indexRank.push({index,value:4})
      return true 
    }

    //find pairs
    if(value == 2){
      //check full
      indexRank.some((valueIndex)=> {
        if(valueIndex.value == 4){
          indexRank.push({index:valueIndex.index,value:7})
          return true 
        }
        //check doble pair
        if(valueIndex.value == 2){

          //check max pair
          let maxIndex = valueIndex.index
          if(index > maxIndex){
            maxIndex = index
          }
          indexRank.push({index:maxIndex,value:3})
          return true 
        }
      })

      indexRank.push({index,value})
      return true 
    }

    //Stack alone cards for higher card comparation
    if(value == 1){
      indexRank.push({index,value})
    }
  })

  // sort first by the rankValue and if rankValue is the same compare the card value
  indexRank.sort((a,b) => { if(b.value - a.value == 0){return b.index - a.index} return b.value - a.value })
  return indexRank;
}

function calcTrickedDeck(jugadas){
  let cardsInPlay = jugadas.flatMap((player) => player.cartas.map((card)=> calcCardValueInMatrix(card)));

  return cardsInPlay.length != new Set(cardsInPlay).size;
}

function compareHands(handA,handB){
    if(handB == undefined){
      return -1
    }
    for (let index = 0; index < handA.length; index++) {
      const elementA = handA[index];
      const elementB = handB[index];
      if(elementA.value > elementB?.value){
        return -1
      }
      if(elementA.value < elementB?.value){
        return 1
      }
      if(elementA.value == elementB?.value){
        if(elementA.index > elementB?.index){
          return -1
        }
        if(elementA.index < elementB?.index){
          return 1
        }
      }
    }
    return 0
}