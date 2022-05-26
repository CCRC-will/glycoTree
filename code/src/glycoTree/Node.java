/**
 * 
 */
package glycoTree;

import java.util.HashMap;
import java.util.Map;

/**
 * Each instance of the Class Node holds information about a monosaccharide constituent of a glycan in the context
 * of a <i>GlycoTree</i>, which provides context-dependent semantics for the constituents of glycans. The semantic 
 * context facilitates mapping of specific residues in a glycan with biological phenomena, such as the enzymes 
 * involved in processing the residue during biosynthesis, any motifs or epitopes in which the residue is included,
 * and many other possibilities.
 *
 *  <br>
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
 * @version 2.0
 */
public class Node {
	
	/**
	 * the Node's archetype, which is a reusable representation of the properties of the residue that are <i>not</i>
	 * context-dependent, including the basic molecular structure (sugar backbone, absolute configuration, anomeric
	 * configuration, and ring form).
	 */
	public NodeArchetype archetype;
	
	/**
	 * the molecular site at which the Node is linked to its parent (i.e., its aglycon).
	 */
	public String site = "0";
	
	/**
	 * a String ID for  the node, facilitates generation of connection tables simply by specifying the NodeID of the 
	 * parent Node of each residue.
	 */
	public String nodeID;
	
	/**
	 * the nodeID of the Node's parent (i.e., aglycon)
	 */
	public String parentID = null;
	
	/**
	 * the parent Node (aglycon) of this Node
	 */
	public Node parent = null;
	
	/**
	 * a canonical Node to which the Node is mapped, based on their common position in the two trees
	 */
	public Node canonicalNode = null;
	
	/**
	 * a HashMap holding a collection of Nodes having the Node as their common parent
	 */
	public Map<String, Node> children = new HashMap<String, Node>();
	
	/**
	 * the position of the Node with respect to the root Node of the tree -  For example, the root Node 
	 * has rank 1, and a Node whose parent is the root Node has rank 2, etc.
	 */
	public int rank = 0;
	
	/**
	 * true if the rank of the Node has been assigned
	 */
	public Boolean rankIsSet = false;
	
	/**
	 * the semantically complete name of a canonical Node, which can be used by other software to refer 
	 * this residue and its molecular context within a glycan structure
	 * 
	 */  
	public String residueName;
	
	/**
	 * the name of the Node inferring basic structure, including the site and identity of any non-glycosyl
	 * substituents - for example, "Glc", "GlcNAc" and "Gal-3S"
	 * 
	 */  
	public String nodeName;
	
	/**
	 * a string describing the Node that includes its ring form - used to populate the canonical tree with
	 * Nodes having a semantically complete residueName - does <i>not</i> include any non-glycosyl
	 * substituent information
	 */
	public String formName;

	/**
	 * a comma separated string of arbitrary length holding all attributes not used for mapping
	 * This allows the number and identity of annotations to change over time
	 */
	public String annotations;
	
	
	/**
	 * a String describing species to which observation of the Node has been limited
	 * deprecated - all annotations put in a single, arbitrary length, comma separated string
	public String limitedTo;  */
	
	/**
	 * a String describing species in which the Node has been not been found
	 * deprecated - all annotations put in a single, arbitrary length, comma separated string
	public String notFoundIn; */
	
	/**
	 * a String specifying glycoTree curator's notes for the Node
	 * deprecated - all annotations put in a single, arbitrary length, comma separated string
	public String notes;  */
	
	/**
	 * A string specifying evidence for the curators annotations
	 * deprecated - all annotations put in a single, arbitrary length, comma separated string
	public String evidence;  */
	
	
	/**
	 * the minimum score for the Node calculated by comparing Nodes in its path to the root with a parallel
	 * path in the canonical tree - a zero value indicates that the Node fits precisely into the 
	 * canonical tree 
	 */
	public int minimumScore = 99999;

	
	
	/**
	 * used to generate a completely blank Node
	 */
	public Node() { 
		super();
	}	
	

	/** 
	 * used to generate a Node when its children and rank are <i>not</i> yet known
	 * but the curator's annotations <i>have</i> been mapped to the Node
	 * @param archetype the Node's archetype
	 * @param nodeID the Node's ID -  either a canonical residue ID (like N15) or a local structure-specific ID (like 4)
	 * @param residueName the Node's residueName
	 * @param nodeName the Node's name (orrepsonds to a SNFG sugar name plus substituents)
	 * @param site the site of linkage to the Node's aglycon (parent)
	 * @param parentID the ID of the Node's parent (aglycon)
	 * @param formName a name specifying the Node's basic name, lacking substituents 
	 * but including the ring form (used to name new canonical residues)
	 */
	public Node(NodeArchetype archetype, String residueName, String nodeID, String site, String nodeName, String parentID, String formName,
			String annotations) {
		super();
		this.archetype = archetype;
		this.nodeID = nodeID;
		this.site = site;
		this.parentID = parentID;
		this.residueName = residueName;
		this.formName = formName;
		this.nodeName = nodeName;
		this.annotations = annotations;
	}
	
	

	/** 
	 * used to generate a Node when its children and rank are <i>not</i> yet known
	 *   and the curator's annotations have <i>not</i> been mapped to the Node
	 * @param archetype the Node's archetype
	 * @param nodeID the Node's ID -  either a canonical residue ID (like N15) or a local structure-specific ID (like 4)
	 * @param residueName the Node's residueName
	 * @param nodeName the Node's name (orrepsonds to a SNFG sugar name plus substituents)
	 * @param site the site of linkage to the Node's aglycon (parent)
	 * @param parentID the ID of the Node's parent (aglycon)
	 * @param formName a name specifying the Node's basic name, lacking substituents 
	 * but including the ring form (used to name new canonical residues)
	 */
	public Node(NodeArchetype archetype, String residueName, String nodeID, String site, String nodeName, String parentID, String formName) {
		super();
		this.archetype = archetype;
		this.nodeID = nodeID;
		this.site = site;
		this.parentID = parentID;
		this.residueName = residueName;
		this.formName = formName;
		this.nodeName = nodeName;
	}

	/** a recursive method that calculates and sets the rank of the Node by traversing to the root Node
	 * 
	 * @return the calculated rank of the Node
	 */
	int setRank() {
		// if (this.parent != null) System.out.printf("\n######Ranking - Parent is %s %s (starting rank is %d)\n", this.parent.nodeID, this.parent, this.rank);
		int r = 0;
		if (this.rankIsSet) {
			// System.out.printf("Rank is already set\n");
			r = this.rank;
		} else {
			// System.out.printf("Changing rank\n");
			if (this.parent == null) {
				// System.out.printf("Parent is null\n");
				r = 1;
			} else {
				// System.out.printf("Parent is NOT null\n");
				// RECURSION
				r = parent.setRank() + 1;
			}
			this.rank = r;
		}
		this.rankIsSet = true;
		// if (this.parent != null) System.out.printf("\nprocessed rank for node %s (%s) with parent %s (%s) -> %d", nodeID, this, this.parent.nodeID, this.parent, rank);
		return(r);
	}
	
	
	/**
	 * compares a Node to another Node to give a score describing the extent of the match, based on equivalence
	 * of their archetypes (fast!!)
	 * @param otherNode the Node to which this Node is being compared 
	 * @param mode specifies the strictness of the comparison <br> 
	 * &nbsp;&nbsp; mode = 0 requires an exact match to return a result of 0 (archetypes are identical)<br>
	 * &nbsp;&nbsp; mode = 1 allows fuzzy matching e.g., alditols can match reducing sugars
	 * @param verbosity the verbosity of the output to stdout upon execution of the method
	 * @return the score of the comparison - zero indicates a match, one indicates a mismatch
	 */
	public int compareTo(Node otherNode, int mode, int verbosity) {
		// like golf: lower returned scores are better; 

		int score = 1;
		
		if (mode == 0) { // exact match required - the two Nodes must have the same archetype object
			if ( (this.archetype == otherNode.archetype) && (this.site.compareTo(otherNode.site) == 0) ) score = 0;
		} else {
			// various kinds of fuzzy matching enabled - site is irrelevant
			// In future versions that perform subtree (motif) matching, at this point
			//  theOther Node may be internal (canonical) while this.Node must be at the reducing end, because
			//  this code block is only reachable for Nodes at the reducing end - see treeBuilder3.scorePathPair()
			if (this.archetype.compareTo(otherNode.archetype, mode, verbosity) == 0) score = 0;
		}
	
		if (verbosity > 5) 
			System.out.printf("\ncompare %s (%s, %s) to %s (%s, %s) -> %d", 
					this.nodeID, this.archetype, this.site, otherNode.nodeID, otherNode.archetype, otherNode.site, score);
		return(score);
	} // end of compareTo()
	
	/**
	 * assigns Node.parent based on Node.parentID (if known)
	 * @param nodeMap a Map containing all Nodes in the current structure
	 */
	public void setParent(Map<String, Node> nodeMap) {
		this.parent = nodeMap.get(this.parentID);
		// System.out.printf("\nJust set parent of node %s (%s) -> %s (%s)", nodeID, this, this.parent.nodeID, this.parent);		
	}

	/** makes a new Node that is a copy of the Node, for example to create a new canonical Node from a Node that is
	 *  found in a specific structure
	 * 
	 * @return the copy of the Node
	 */
	public Node copy() {
		Node copy = new Node();
		copy.archetype = this.archetype;
		copy.residueName = this.residueName;
		copy.site = this.site;
		copy.parentID = this.parentID;
		copy.children = this.children;
		copy.rank = this.rank;
		copy.nodeID = this.nodeID;
		copy.parent = this.parent;
		copy.canonicalNode = this.canonicalNode;
		copy.formName = this.formName;
		copy.nodeName = this.nodeName;
		return(copy);
	}
}
