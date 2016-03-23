



export function parseViewTableRows($, $table){
  var rows = [];
  $table.children().each( (index, element) => {

    if(! element ) {return; }
    if(element.name === 'script'){ return; }
    if(element.name === 'option'){ rows.push($(element)); return; }
    let $row = $(element).children();

    if($row.length === 0){
      return rows.push($(element));
    }
    else if($row.get(0) && $row.get(0).name === 'th'){ return; }
    else if($($row.get(0)).text() === 'Normal, Nonbillable Normal'){ return; }
    else { return rows.push($row); }
  });

  return rows;
}


