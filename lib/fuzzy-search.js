Fuzzy = {};

var defaultOptions = {
	caseSensitive: false,
	maxDistance: -1,
	maxResults: 5,
}

// function searches given cursor for search string and returns most similar
// strings ranked by Levenshtein distance.
// 	maxDistance parameter is used to limit results to less-or-more similar
//  words in small datasets
//  -1 means "auto". Function will auto set maxDistance based on searchString.
//  undefined means "no limit". Searching for string "beer" can return a
//  "wife" ( we don't want that ).
var mostSimilarStrings = Fuzzy.mostSimilarStrings =
function mostSimilarStrings( cursor, fieldName, searchString, options ){
	var rankedWords = [];
	var options 		= options || {};
	_.defaults( options, defaultOptions );

	if ( typeof( fieldName ) !== 'string' )
		throw new Meteor.Error( "Fuzzy search requires a fieldName string" );

  if ( typeof( searchString ) != 'string' || searchString == "" )
		return [ "" ];

  if ( ! options.caseSensitive )
		searchString = searchString.toUpperCase();

  var arrayA = searchString.split( /\s+/ );

  if ( options.maxDistance < 0 ){
    // auto set maxDistance: longest word * number of words * 0.7
    // Btw, I got 0.7 with trial-and-error method
    var longestWord = 0;
    arrayA.forEach( function( str ) {
      if( str.length > longestWord )
        longestWord = str.length;
    } );
    options.maxDistance = Math.ceil( longestWord * arrayA.length * 0.7 );
  }

  cursor.forEach( function( doc ) {
    var candidate = doc;
    var slice = fieldName.split( '.' );

		while ( slice.length )
      candidate = candidate[ slice.shift() ];


    if ( candidate ) {
      // we want to return unmodified string ( with the same case )
      var originalCandidate = candidate;

      if ( ! options.caseSensitive )
				candidate = candidate.toUpperCase();

      var arrayB = candidate.split( /\s+/ );
      var dist = 0;

			if ( arrayA.length <= 1 && arrayB.length <= 1 )
        dist = levenshteinDistance( searchString, candidate );
      else
        dist = levenshteinDistanceExt( arrayA, arrayB );

      if ( dist < options.maxDistance )
        rankedWords.push({ word: originalCandidate, distance: dist });
    }
  });

	rankedWords.sort( function( a, b ){
		return a.distance - b.distance;
	});

	return rankedWords.map( function( word ){ return word.word }).slice( 0, options.maxResults );
}



var mostSimilarString = Fuzzy.mostSimilarString =
function mostSimilarString( cursor, fieldName, searchString, options ){
	return mostSimilarStrings( cursor, fieldName, searchString, options )[ 0 ];
};


// Levenshtein Distance
function levenshteinDistance(  strA, strB, limit  ) {
  var strALength = strA.length, strBLength = strB.length;

  var max_len = 0;
  if (  strALength > strBLength  )
    max_len = strALength + 1;
  else
    max_len = strBLength + 1;

  var matrix = [];
  for (  var i = 0; i < max_len; i++  ) {
    matrix[i] = [i];
    matrix[i].length = max_len;
  }
  for (  var i = 0; i < max_len; i++  ) {
    matrix[0][i] = i;
  }

  if (  Math.abs(  strALength - strBLength  ) > (  limit || 32  )  )
		return limit || 32;
  if (  strALength === 0  ) return strBLength;
  if (  strBLength === 0  ) return strALength;

  // Calculate matrix
  var strA_i, strB_j, cost, min, t;
  for (  i = 1; i <= strALength; ++i  ) {
    strA_i = strA[i-1];

    for (  j = 1; j <= strBLength; ++j  ) {
      if (  i === j && matrix[i][j] > 4  )
				return strALength;

      strB_j = strB[j-1];
      cost = ( strA_i === strB_j ) ? 0 : 1;

			// Calculate the minimum ( much faster than Math.min( ... ) ).
      min = matrix[i - 1][j] + 1;                      // Deletion.
      if (( t = matrix[i][j - 1] + 1 ) < min  )
				min = t;   // Insertion.
      if (( t = matrix[i - 1][j - 1] + cost ) < min  )
				min = t;   // Substitution.

      matrix[i][j] = min;     // Update matrix.
    }
  }

  return matrix[ strALength ][ strBLength ];
};



// Receives two array of words and calculates distances between all words
// return sum of first n smallest distances where n = number of words in arrayA
function levenshteinDistanceExt( arrayA, arrayB )
{
  // create array of distances between all words
  var arrayC = [];
  var c = 0;
  for ( var a = 0; a < arrayA.length; a++ ) {
    for ( var b = 0; b < arrayB.length; b++ ) {
      arrayC[c] = levenshteinDistance( arrayA[a], arrayB[b] );
      c++;
    }
  }

	arrayC.sort();

  // sum of arrayA.length best matches
  var result = 0;
  for ( var i = 0; i < arrayA.length; i++ )
    result += arrayC[i];
  return result;
}
