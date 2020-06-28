package gctTOcsv;

import java.util.Arrays;
import java.util.Map;
import java.util.Map.Entry;

public class Sorter {
	/**
	 * Utility class to facilitate sorting of various types of Collections
	 */
	public Sorter() {
		// TODO Auto-generated constructor stub
	}
	
	// would be good to make this more generic !
	/**
	 * generates a numerically sorted array of the keys for a Map of Maps, which can be 
	 * iterated in a defined way using "for" loop
	 * @param map the Map whose keys are to be numerically sorted
	 * @return an array of String, whose values have been numerically sorted
	 */
	public String[] sortMapKeysNumeric (Map<String, ?> map) {
		String[] sortedKeys = new String[map.size()];
		int[] sortedNumericIndices = new int[map.size()];
		int count = 0;
		// populate sortedArray with (int) keys
		for (Map.Entry<String, ?> entry : map.entrySet())  {
			sortedNumericIndices[count++] = Integer.valueOf(entry.getKey() );
		}
		Arrays.sort(sortedNumericIndices);
		for (int i = 0; i < sortedNumericIndices.length; i++) {
			sortedKeys[i] = Integer.toString(sortedNumericIndices[i]);
		}
		return (sortedKeys);
	}
	



}
