<?php

// recapitulates the java class 'BitSet'

class BitSet {
  // $data is an array of integers, which are accessed and manipulated by methods here
  private $data = [];
  // the format used by the pack and unpack methods; this determines the 'word size' below
  private $pack_fmt = "L*";
  // the 'word size' (bits) of each long integer in $data
  private $ws = 32;

  function __construct($data, $dataType) {
    switch ($dataType) {
      case "none":
        break;
      case "base64":
        $byteData = base64_decode($data);
        $this->data = unpack($this->pack_fmt, $byteData);
        break;
      case "byte_array":
        $this->data = unpack($this->pack_fmt, $data);
        break;
      case "long_array":
        $this->data = $data;
        break;
      default:
        break;
    }
  }  // end of __construct()


  function and($probe) {
     foreach($this->data as $i => $v) {
       $this->data[$i] = $this->data[$i] & $probe->data[$i];
     }
  }


  function or($probe) {
     foreach($this->data as $i => $v) {
       $this->data[$i] = $this->data[$i] | $probe->data[$i];
     }
  }


  function xor($probe) {
     foreach($this->data as $i => $v) {
       $this->data[$i] = $this->data[$i] ^ $probe->data[$i];
     }
  }


  function clone() {
     $clonedBitSet = new BitSet($this->data, "long_array");
     return $clonedBitSet;
  }

  function toLongArray() {
    return $this->data;
  } 


  function toByteArray() {
    $byteData = "";
    foreach ($this->data as $i => $v) {
      $byteData .= pack($this->pack_fmt, $v);
    }
    return $byteData;
  } 


  function toString() {
    // returns a string containing (comma-separated) indices of set bits
    $repStr = "{";
    $sep = "";
	  foreach($this->data as $i => $v) {
      for ($k = 0; $k < $this->ws; $k++) { // each bit in v
		  // the indexing scheme ('one-indexed') for $data is defined by the unpack method
		  // this is a bit unconventional, but beyond the programmer's control
        // Consequently, to calculate bitIndex, must subtract 1 from i because
		  //    the array $data has indices {1-m}  (m is the number of integers in data)
		  //    while the n bits have indices {0-n}   (n is the number of bits in the set)
        $bitIndex = $k + $this->ws * ($i - 1);
        if ($this->getLongBit($v, $k) == 1) {
          $repStr .= $sep . $bitIndex;
          $sep = ", ";
        }
      }
    }
    $repStr .= "}";
    return($repStr);
  } // end of function toString()


  function length() {
    // returns the logical length of the bitSet, i.e., the index of the highest set bit + 1
    $len = 0;
    foreach($this->data as $i => $v) {
      for ($k = 0; $k < $this->ws; $k++) {
        if ($this->getLongBit($v, $k) == 1) {
          $len = $this->ws * ($i - 1) + $k + 1;
        }
      }
    }
    return($len);
  } // end of function length()


  function size() {
    // returns the nuber of bits used to encode the bitSet
    return(sizeof($this->data) * $this->ws);
  }


  function toBitString() {
    // returns a string showing all bits explicitly (as 1 or 0) in bitSet
    $repStr = "";
    foreach($this->data as $i => $v) {
      for ($k = 0; $k < $this->ws; $k++) {
        $repStr .= $this->getLongBit($v, $k);
      }
    }
    return($repStr);
  } // end of function toBitString()


  function set($k) {
    $i = intdiv($k, $this->ws) + 1;
    $j = $k % $this->ws;
    $this->setLongBit($this->data[$i], $j);
  } // end of function set()


  function flip($k) {
    $i = intdiv($k, $this->ws) + 1;
    $j = $k % $this->ws;
    $this->flipLongBit($this->data[$i], $j);
  } // end of function flip()


  function get($k) {
    $i = intdiv($k, $this->ws) + 1;
    $j = $k % $this->ws;
    return($this->getLongBit($this->data[$i], $j));
  } // end of function get()


  function clear($k) {
    if ($k == -1) {
      for ($i = 1; $i < 33; $i++) {
        $this->data[$i] = 0;
      }
    } else {
      $i = intdiv($k, $this->ws) + 1;
      $j = $k % $this->ws;
      $this->clearLongBit($this->data[$i], $j);
    }   
  }


  function cardinality() {
    $c = 0;
    foreach($this->data as $i => $v) { 
      $c += $this->longCardinality($v);
    }
    return($c);
  }


  function isEmpty() {
    $result = ($this->cardinality() == 0) ? 1 : 0;  
    return($result);
  }


  // for use within the BitSet class
  function clearLongBit(&$long, $k) {
    // argument $long passed by reference so it can be changed
    $mask = 0;
    for ($i = 0; $i < $this->ws; $i++) {
        $rev = $this->ws - $i - 1;  // 'reversed' index
        if ($rev != $k) $mask++;
        // do not shift last bit (where i = $this->ws - 1)
        if ($i < ($this->ws - 1)) $mask <<= 1;
    }
    $long = $long & $mask;
  }

  // for use within the BitSet class
  function flipLongBit(&$long, $k) {
    // argument $long passed by reference so it can be changed
    $b = (1 << $k);
    $long = $long ^ $b; // XOR
  }

  // for use within the BitSet class
  function setLongBit(&$long, $k) {
    // argument $long passed by reference so it can be changed
    $long = (1 << $k) | $long;
  }

  // for use within the BitSet class
  function getLongBit($long, $k) {
    $b = (1 << $k);
    return ( ($b & $long) > 0 ? 1 : 0 );
    // if $long or $k are not compatible with comparator, return error (-1)
    return (-1); 
  }

  // for use within the BitSet class
  function longCardinality($long) {
    $c = 0;
    while ($long) {
        $c += $long & 1;
        $long >>= 1;
    }
    return $c;
  }
  
}
 
?>
