/**
 * 
 */
package glycoTree;

import java.util.ArrayList;

/**
 * Each instance of the Class NodeArchetype holds information about the basic structure of a {@link glycoTree.Node}.<br>
 * This is limited to the {@link glycoTree.SNFGSugar} (which specifies the basic sugar backbone), its anomeric
 * configuration, its absolute configuration, and its ring form - this allows rapid comparison of Nodes simply
 * by comparing their archetypes
 * <br>
 *  Copyright 2020 William S York
 *  <br>
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *  <br>
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *  <br>
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see &lt;https://www.gnu.org/licenses/&gt;.
 * <br>
 * @author wsyork
 *
 */
public class NodeArchetype {
	
	/** an instance of {@link glycoTree.SNFGSugar}, defining the basic chemical structure of the archetyhpe
	 * 
	 */
	SNFGSugar sugar = null;
	
	/**
	 * the anomeric configuration of the archetype
	 */
	String anomer;
	
	/**
	 * the absolute configuration of the archetype
	 */
	String absolute;
	
	/**
	 * the ring form of the archetype
	 */
	String ring;
	
	/**
	 * used when the SNFGSugar object is known
	 * @param sugar the SNFGSugar for the archetype
	 * @param anomer the anomeric configuration of the archetype
	 * @param absolute the absolute configuration of the archetype
	 * @param ring the ring form of the archetype
	 */
	public NodeArchetype(SNFGSugar sugar, String anomer, String absolute, String ring) {
		super();
		this.sugar = sugar;
		this.anomer = anomer;
		this.absolute = absolute;
		this.ring = ring;
	}

	/**
	 * used when the SNFGSugar object is <i>not</i> known
	 * @param sugarList a complete list of SNFGSugars
	 * @param sugarName the name of the sugar specified by the archetype 
	 * @param anomer the anomeric configuration of the archetype
	 * @param absolute the absolute configuration of the archetype
	 * @param ring the ring form of the archetype
	 */
	public NodeArchetype(ArrayList<SNFGSugar> sugarList, String sugarName, String anomer, String absolute, String ring) {
		// matches the sugarName to a SNFGsugar in sugarList then generates a NodeArchetype using that SNFGsugar
		super();

		int sugarIndex = -1;
		for (int i = 0; i < sugarList.size(); i++) {
			// look for all sugar synonyms in the list
			if (sugarName.compareTo(sugarList.get(i).name) == 0) sugarIndex = i;
			if (sugarName.compareTo(sugarList.get(i).synonymPC) == 0) sugarIndex = i;
			if (sugarName.compareTo(sugarList.get(i).synonym2) == 0) sugarIndex = i;
		}
		// System.out.printf("Matched SNFGSugar %s\n", sugarList.get(sugarIndex).name);
		if (sugarIndex == -1) {
			// @@@ System.out.printf("\n### Error! No SNFG Sugar with the name %s", sugarName);
			this.sugar = null;  // may need to create instance of SNFGsugar = "theEmptySugar"
		} else {
			this.sugar = sugarList.get(sugarIndex);
		}
		this.anomer = anomer;
		this.absolute = absolute;
		this.ring = ring;
	}
	
	/**
	 * compares one archetype to another, returning a score (0 indicates a perfect match)
	 * @param theOther the other archetype to which this.NodeArchetype is compared
	 * @param mode the strictness of the matching criteria
	 * &nbsp;&nbsp; mode = 0 requires an exact match to return a result of 0 (archetypes are identical)<br>
	 * &nbsp;&nbsp; mode = 1 fuzzy matching by ignoring anomeric configuration<br>
	 * &nbsp;&nbsp; mode = 2 fuzzy matching by ignoring anomeric configuration and ring form<br>
	 * &nbsp;&nbsp; mode = 3 quasi matching by SNFG symbol - e.g., Glcol matches Glc (both are blue circles)

	 * @param verbosity for stdout
	 * @return an integer score: 0 for match, 1 for mismatch
	 */
	public int compareTo(NodeArchetype theOther, int mode, int verbosity) {
		int score = 1;
		if (verbosity > 5) System.out.printf("\n Mode %d used for next comparison ", mode);
		switch (mode) {
		case 0: 
			// exact match: score -> 0
			if  ( (this.sugar == theOther.sugar) 
					&& (this.anomer.compareTo(theOther.anomer) == 0)
					&& (this.absolute.compareTo(theOther.absolute) == 0) 
					&& (this.ring.compareTo(theOther.ring) == 0) ) {
				score = 0;
			}
			break;
			
		case 1:
			// exact match except anomeric configuration ignored
			if  ( (this.sugar == theOther.sugar) 
					&& (this.absolute.compareTo(theOther.absolute) == 0) 
					&& (this.ring.compareTo(theOther.ring) == 0) ) {
				score = 0;
			}
			break;
			
		case 2:
			// exact match except anomeric configuration and ring form ignored
			if  ( (this.sugar == theOther.sugar) 
					&& (this.absolute.compareTo(theOther.absolute) == 0) ) {
				score = 0;
			}
			break;
			
		case 3: 
			// quasi match using SNFG names - e.g., Glcol matches Glc because Glc.quasi is Glcol
			// if (verbosity > 5) {
			//	System.out.printf("\n this.absolute is %s - theOther.absolute is %s\n - this.sugar.name is %s  - theOther.sugar.quasi is %s - - this.sugar.quasi is %s - theOther.sugar.name is %s",
			//			this.absolute, theOther.absolute, this.sugar.name,  theOther.sugar.quasi, this.sugar.quasi, theOther.sugar.name);
			// }
			if  ( ( (this.sugar.name == theOther.sugar.name) || (this.sugar.name == theOther.sugar.quasi) )
					&& (this.absolute.compareTo(theOther.absolute) == 0) ) {
				score = 0;
			}
			break;
			
			default:
			break;
		}
		// System.out.printf("\nCompare:  this %s, %s, %s, %s to that %s, %s, %s, %s -> %d", this.sugar, this.anomer, this.absolute, this.ring,
		//					that.sugar, that.anomer, that.absolute, that.ring, score);
		return(score);
	} // end of compareTo
	

}
