package glycoTree;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileWriter;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

/**
 * TreeBuilder3 takes csv files containing descriptions of the resides in a
 * glycan and maps each to a list of "canonical" residues described in another
 * csv file. Glycans can then be described as collections of canonical residues,
 * which themselves can be mapped to molecular context-dependent properties,
 * such as enzymes involved in their biogenesis/biodegradation or their
 * inclusion in structural motifs having specific biological functions.
 * <br>
 * Usage: &nbsp;&nbsp; 
 * java -jar TreeBuilder3.jar [options]<br>
 * &nbsp;&nbsp; (See {@link #main(String[])} method for options.)
 * @author wsyork
 * 
 */
public class TreeBuilder3 {
	
	/**
	 * the verbosity of the output to stdout
	 */
	static int v = 0; 

	/**
	 * a constant with value {@value}
	 */
	static final int EXACT_MATCH = 0;
	
	/**
	 * the total score (sum of leaf scores) calculated for the probe - 0 is perfect
	 */
	static int totalScore = -1;
	
	/**
	 * the accession number or trivial name for the probe structure
	 */
	static String glycanID = null;

	/**
	 * An ArrayList containing SNFG sugar objects
	 */
	static ArrayList<SNFGSugar> sugarList = new ArrayList<SNFGSugar>();
	
	/**
	 * An ArrayList containing the NodArchetypes
	 */
	static ArrayList<NodeArchetype> archList = new ArrayList<NodeArchetype>();
	
	/**
	 * A HashMap containing all of the canonical Nodes
	 */
	static Map<String, Node> canonicalNodes = new HashMap<String, Node>();
	
	/**
	 * A HashMap containing all of the Nodes in the structure being processed (i.e., the probe tree)
	 */
	static Map<String, Node> probeNodes = new HashMap<String, Node>();
	
	/**
	 * A HashMap containing all of the leaf Nodes in the structure being processed (i.e., the probe tree)
	 */
	static Map<String, Node> probeLeaves = new HashMap<String, Node>();
	
	/**
	 * A HashMap containing Nodes in the structure being processed  (i.e., the probe tree) that are
	 * close to the root (i.e., with rank &le; matchLength) - facilitates rapid checking of match criteria
	 */
	static Map<String, Node> probePseudoLeaves = new HashMap<String, Node>();
	
	/**
	 * A HashMap containing all of the leaf Nodes in the canonical tree
	 */
	static Map<String, Node> canonicalLeaves = new HashMap<String, Node>();
	
	/**
	 * A HashMap comprising sub-Maps, each of which contains the Nodes in the canonical tree 
	 * having the same rank - these sub-Maps are accessed using the ranks as indices of the enclosing Map 
	 * 
	 */
	static Map<Integer, Map<String, Node>> canonicalRankList = new HashMap<Integer, Map<String, Node>>();
	
	/**
	 * A HashMap comprising sub-Maps, each of which contains the Nodes in the probe tree 
	 * having the same rank - these sub-Maps are accessed using the ranks as indices of the enclosing Map 
	 * 
	 */	
	static Map<Integer, Map<String, Node>> probeRankList = new HashMap<Integer, Map<String, Node>>();
	
	/*
	 * @deprecated
	 */
	// static Map<String, Map<String, Integer>> pathScores = new HashMap<String, Map<String, Integer>>();
	
	/*
	 * @deprecated
	 */
	// 	static Map<String, Map<String, Integer>> pseudoPathScores = new HashMap<String, Map<String, Integer>>();
	
	/**
	 * the name of the output file describing issues with processing the data
	 *
	*/
	static String mismatchFileName = "report.csv";


	/**
	 * This is the main method that collects data and generates mapped output files.
	 * Command line arguments (args):<br>
	 * -v: verbosity has a value of 0-9. For batch processing, use "-v 0" so very
	 * litte information is provided to std out<br>
	 * -e: the canonical tree extension mode. <br>
	 * &nbsp;&nbsp;&nbsp; "-e 0" - Map only perfectly matched structures, the tree is not extended<br>
	 * &nbsp;&nbsp;&nbsp; "-e 1" - Map perfectly and partially matched structures, leaving unmatched residues as "unassigned", 
	 * the tree is not extended<br>
	 * &nbsp;&nbsp;&nbsp; "-e 5" - Map perfectly and partially matched structures, and extend the tree by adding probe residues  
	 * that are directly attached to canonical residues - use only for structures that are known to be biologically relevant<br>
	 * -o: the name of the output file containing the nodes to extend the glycotree<br>
	 * -m: the matching mode; <br>
	 * &nbsp;&nbsp; "-m 0" requires an exact match to return a result of 0 (archetypes are identical)</br>
	 * &nbsp;&nbsp; "-m 1" fuzzy matching by ignoring anomeric configuration<br>
	 * &nbsp;&nbsp; "-m 2" fuzzy matching by ignoring anomeric configuration and ring form<br>
	 * &nbsp;&nbsp; "-m 3" quasi matching by SNFG symbol - e.g., Glcol matches Glc (both are blue circles)<br>
	 * &nbsp;&nbsp;&nbsp;&nbsp; modes 1 - 3 are <i>only</i> applied to reducing end residues, mode 0 is applied 
	 * to all others<br>
	 * -n: the minimum number of residues in a matching pathway from a leaf to the
	 * root; determines whether the mapped structure will be written to a (valid) output file<br>
	 * -l: the full file name containing a list of csv files (structures) to process<br>
	 * -g: the name of a single csv file specifying a glycan structure to process<br>
	 * -i: the name of a csv file of special interest, provides full verbosity when
	 * processing this particular file<br>
	 * -s: the name of a csv "sugar file" containing information about the SNFG
	 * representation of various residues<br>
	 * -c: the name of the csv file containing canonical residues (nodes) to which
	 * residues in the glycan will be mapped<br>
	 * 
	 * @param args
	 *            These parameters are passed to the program at initiation
	 */

	public static void main(String[] args) {
		String listFileName = null;
		String sugarFileName = null;
		String canonicalNodeFileName = null;
		String glycanFileName = null;
		String extensionFileName = null;
		String extensionString = "residue,residue_ID,name,anomer,absolute,ring,parent_id,site,form_name\n";
		String interestingFile = "";
		int tv = 0;
		int matchMode = 1;
		int matchLength = 2;
		int extendMode = 0;

		for (int i = 0; i < args.length; i++) {
			char c1 = args[i].charAt(0);
			char c2 = '0';
			if (args[i].length() > 1)
				c2 = args[i].charAt(1);
			// String s = "";
			// if (i < args.length - 1) s = args[i+1];
			// System.out.printf("%d: %s (%s)\n", i, args[i], s);
			if (c1 == '-') {
				switch (c2) {
				case 'v':
					i++;
					v = Integer.valueOf(args[i]);
					tv = v;
					break;
				case 'e':
					i++;
					extendMode = Integer.valueOf(args[i]);
					break;
				case 'o':
					i++;
					extensionFileName = args[i];
					break;
				case 'm':
					i++;
					matchMode = Integer.valueOf(args[i]);
					break;
				case 'n':
					i++;
					matchLength = Integer.valueOf(args[i]);
					break;
				case 'l':
					i++;
					glycanFileName = null; // if list file is given LAST, glycan file is ignored
					listFileName = args[i];
					break;
				case 'i':
					i++;
					// set the name of a file of interest - during processing of this file,
					// verbosity = 9
					interestingFile = args[i];
					break;
				case 's':
					i++;
					sugarFileName = args[i];
					break;
				case 'c':
					i++;
					canonicalNodeFileName = args[i];
					break;
				case 'g':
					i++;
					listFileName = null; // if glycan file is given LAST, list file is ignored
					glycanFileName = args[i];
					break;
				default:
					System.out.printf("unsupported argument: %s\n", args[i]);
				}
			} else {
				System.out.printf("poorly formed argument (no dash): %s\n", args[i]);
			}
		}

		String rs = "file " + glycanFileName;
		if (listFileName != null)
			rs = "files in list " + listFileName;
		// String reportString = "\n\nData processing report for " + rs + " using
		// canonical tree from file " + canonicalNodeFileName + "\n";
		String[] codes = { "0: perfect match", "1: unmatched leaf", "2: unmatched internal", "3: unmatched residue", "", "", "",
				"7: sugar not found", "8: matching paths too short", "9: glycan too short", "10: corrupt input"  };
		String reportString = "glycan_ID,total score,mismatched leaf ID,rank,description,path score,matching pruned path length,longest matching path,path length threshold,strongest rejection criterion";

		if (v > 0) {
			ZoneId zonedId = ZoneId.of("America/New_York");
			ZonedDateTime justNow = ZonedDateTime.now(zonedId);
			String nowStr = String.format("Current Time : %tF %<tR", justNow);
			System.out.printf("%s\n", nowStr);
			System.out.printf("Verbosity: %s\n", v);
			System.out.printf("Match mode: %s\n", matchMode);
			System.out.printf("Match length: %s\n", matchLength);
			System.out.printf("Extension mode for Canonical Tree: %s\n", extendMode);

			if (listFileName != null)
				System.out.printf("List File Name: %s\n", listFileName);
			if (sugarFileName != null)
				System.out.printf("Sugar File Name: %s\n", sugarFileName);
			if (canonicalNodeFileName != null)
				System.out.printf("Canonical Node File Name: %s\n", canonicalNodeFileName);
			if (glycanFileName != null)
				System.out.printf("Glycan File Name: %s\n", glycanFileName);
		}

		// System.exit(0);;

		if (v > 1)
			System.out.printf("\nsugar file name: %s", sugarFileName);

		importSugars(sugarFileName);
		if (v > 4) {
			System.out.printf("\n\n* Imported SNFG sugars *\n");
			System.out.printf("%-7s,%32s,%12s,%12s,%12s,%12s,%12s,%16s\n",
					"index", "object", "name", "shape", "color",
					"synonym1", "synonym2", "quasi-synonym");
			for (int i = 0; i < sugarList.size(); i++) {
				SNFGSugar s = sugarList.get(i);
				System.out.printf("%-7d,%32s,%12s,%12s,%12s,%12s,%12s,%16s\n",
						i, s, s.name, s.shape, s.color, s.synonymPC, s.synonym2, s.quasi);
			}
		}

		// String nodeFileName = args[2];
		if (v > 1)
			System.out.printf("\n* Importing canonical data from node file: %s\n", canonicalNodeFileName);
		int archCount = importData(canonicalNodeFileName, 0, archList, canonicalNodes);

		if (v > 4)
			showArchetypes(archList);

		if (v > 4)
			System.out.printf("\n\n* Ranking canonical nodes *");
		int maxRank = createRankList(canonicalNodes, canonicalRankList);
		if (v > 4)
			listRanks(canonicalRankList, maxRank);
		if (v > 4)
			System.out.printf("\n\n* Assigning canonical node children *");
		if (v > 4)
			listChildren(canonicalNodes);
		if (v > 4)
			System.out.printf("\n\n* Generating Canonical Node leaf list *");
		createLeafList(canonicalNodes, canonicalLeaves);
		if (v > 4) {
			System.out.printf("\n\nCanonical Node leaves (rank): ");
			listLeaves(canonicalLeaves);
		}

		String idPrefix = getIDprefix(canonicalNodes);
		if (v > 4)
			System.out.printf("\n\n* Canonical Node ID prefix is %s", idPrefix);
		String nextID = getNextId(canonicalNodes);
		if (v > 2)
			System.out.printf("\n* The First (extended) Canonical Node ID assigned in this run will be %s\n", nextID);

		ArrayList<String> files = new ArrayList<String>();
		if (listFileName != null) {
			// open and parse the list file, putting elements in the ArrayList "files"
			if (v > 0)
				System.out.printf("\n\n###### Using a list (%s) containing input files ######\n", listFileName);
			files = parseListFile(listFileName);
		} else if (glycanFileName != null) {
			// just use the glycanFileName as the glycan file file
			files.add(glycanFileName);
		} else {
			System.out.printf("** No valid glycan input files ** \n");
		}

		Boolean foundAfile = false;
		for (Iterator<String> f_iter = files.iterator(); f_iter.hasNext();) {
			foundAfile = true;
			// reinitialize HashMap's
			probeNodes = new HashMap<String, Node>();
			probeLeaves = new HashMap<String, Node>();
			probeRankList = new HashMap<Integer, Map<String, Node>>();
			// pathScores = new HashMap<String, Map<String, Integer>>();

			Map<String, Node> mismatchMap = new HashMap<String, Node>();
			Map<String, Integer> matchStats = new HashMap<String, Integer>();
			int rejectCode = 0; // zero when everything matches
			// int maxRejectCode = rejectCode;
			int csvRejectCode = 0; // rejectCode returned by writeCSV
			// also reinitialize list of nodes to add for the CURRENT probe structure
			ArrayList<Node> nodes2add = new ArrayList<Node>();

			glycanFileName = f_iter.next(); // keep this for later use

			// Increase verbosity for interesting file
			if (glycanFileName.compareTo(interestingFile) == 0) {
				System.out.printf("\n$$$$$$ temporary verbosity is %s\n", tv);
				v = 9;
			} else {
				v = tv;
			}

			// define directories and file names for input and output
			String glycanID = glycanFileName.substring(0, glycanFileName.indexOf("."));
			int start = glycanFileName.lastIndexOf("/");
			String directory = "";
			if (start != -1) { // check if filename includes directory
				String trimmedFileName = glycanFileName.substring((start + 1), glycanFileName.length());
				directory = glycanFileName.substring(0, start + 1);
				glycanID = trimmedFileName.substring(0, trimmedFileName.indexOf("."));
			}

			String outFileName = directory + "mapped/" + glycanID + ".csv";
			mismatchFileName = directory + "mapped/report.csv";

			// Process the current file
			if (v > 0) {
				System.out.printf("\n\n########## Processing file %s ##########\n", glycanFileName);
			}
			if (v > 3)
				System.out.printf("\n ***  outFileName is %s; glycanID is %s  ***\n", outFileName, glycanID);

			// import data from current structure file, populate targetNodeMap
			if (v > 1)
				System.out.printf("\n* Importing probe nodes (assigning archetypes, parents and children) *");
			int probeCheck = importData(glycanFileName, 1, archList, probeNodes);
			if (probeCheck < 0) {
				System.out.printf("\n## poorly formed input file %s (code %d)##\n", glycanFileName, probeCheck);
				rejectCode = 10;
			} else {

				if (v > 1)
					System.out.printf("\n\n* Ranking probe nodes *");

				maxRank = createRankList(probeNodes, probeRankList);
				if (v > 1)
					System.out.printf("\nMaximum Probe Rank is: %d", maxRank);
				if (maxRank < matchLength) {
					// cannot possibly map structure to canonical tree
					rejectCode = 9; // 9 -> the glycan is shorter than matchLength
					// maxRejectCode = 9;
					reportString += "\n" + glycanID + ", -1,0,0,glycan is too short,0,0,0," + matchLength + ","
							+ codes[rejectCode];
				}
			}

			Map<String, Integer> pseudoMatchStats = new HashMap<String, Integer>();
			if (rejectCode < 9) {
				if (v > 1) {
					listRanks(probeRankList, maxRank);
					listChildren(probeNodes);
					System.out.printf("\n\n* Generating Probe Node leaf list *");
				}

				createLeafList(probeNodes, probeLeaves);

				if (v > 1) {
					System.out.printf("\nTarget Node leaves (rank):");
					listLeaves(probeLeaves);
				}

				// In this section, getPathScores is called to evaluate any paths where 
				// (length = matchLength), to see if it is worth advancing
				if (v > 1)
					System.out.printf("\n\n** Working on short paths with %d nodes at root end **", matchLength);
				// Here, all probe leaves all have (rank = matchLength), so they are "pseudo"
				// leaves
				// pseudoLeafTotalScore describes results for these short reducing end paths
				// Perfect match here means it is OK to continue mapping probe leaves
				int pseudoLeafTotalScore = -1; //
				// pseudoPathScores = new HashMap<String, Map<String, Integer>>(); // declared GLOBALLY
				// "pseudo leaves" correspond exclusively to probe nodes with rank = matchLength
				probePseudoLeaves = probeRankList.get(matchLength); // declared globally
				Map<String, Node> pseudoLeafMismatchMap = new HashMap<String, Node>();
				pseudoLeafTotalScore = getPathScores(matchMode, probePseudoLeaves,
						canonicalRankList, pseudoLeafMismatchMap, true);
				pseudoMatchStats = processPaths(probePseudoLeaves);
				int longestPseudoPath = pseudoMatchStats.get("longestMatch");
				if (v > 1)
					System.out.printf("\n\n* Longest matching pseudo path has " + longestPseudoPath
							+ " residues.  Threshold is " + matchLength);
				// when matchLength residues at the root end of the structure match the
				// canonical tree
				// the glycan contains a path that is at least matchLength long, so mapping is
				// justified (even if not complete)
				if (pseudoMatchStats.get("longestMatch") < matchLength) {
					rejectCode = 8; // 8 -> the reducing end of the glycan does not map to any canonical path with
									// length = matchLength
					reportString += "\n" + glycanID + "," + pseudoLeafTotalScore + ",summary,0,matching paths are too short,"
							+ pseudoLeafTotalScore + ",-," + longestPseudoPath + "," + matchLength + ","
							+ codes[rejectCode];
				}
			}

			if (rejectCode < 8) {
				if (v > 1)
					System.out.printf("\n\n** Working on full-length paths **");
				totalScore = getPathScores(matchMode, probeLeaves, canonicalRankList,
						mismatchMap, true);
				if (v > 1)
					System.out.printf("\n* Processing paths *");
				matchStats = processPaths(probeLeaves);
				if (v > 1)
					System.out.printf("\n* Longest full-length matching path has " + matchStats.get("longestMatch")
							+ " residues.  Threshold is " + matchLength);
				// don't bail if full-length paths are not long enough - may need to save anyway
				// if (matchStats.get("longestMatch") < matchLength) {
				// }

				if (mismatchMap.size() > 0) rejectCode = 3; 

				if ( (totalScore > 0) && (extendMode > 0) ) {
					// The overall full-length match is not perfect, but assign possible mappings

					// prune mismatched leaves one at a time and match the pruned paths
					int totalPrunedScore = 0;
					for (Map.Entry<String, Node> entry : mismatchMap.entrySet()) {
						// start with each mismatched probe leaf
						Node n = entry.getValue();
						Node leafNode = n;

						int prunedScore = 1;
						while ( (prunedScore != 0) && (leafNode.rank > matchLength) && (rejectCode < 7) ) {
							// traverse to matchLength residues from root (while a perfect match has not
							// been found)
							// this loop executes until it reaches close to the root or an assigned node

							// Handle archetypes and their errors 
							NodeArchetype na = leafNode.archetype;
							String s = "";
							String description = "";

							// assign values to strings corresponding to the sugar name and description
							if (na.sugar != null) {
								s = na.sugar.name;
								description = na.anomer + "-" + na.absolute + "-" + s + "_" + na.ring;
							} else {
								rejectCode = 7; // cannot match a sugar in the digital sequence
								// maxRejectCode = rejectCode;
								if (na != null) {
									description = na.anomer + "-" + na.absolute + "-[?]_" + na.ring;
								} else {
									// archetype is null, so its description is "[???]"
									description = "[???]";
								}
								// report the mismatched leaf node's name, description, etc
								reportString += "\n" + glycanID + "," + totalScore + "," + n.nodeID + "," + n.rank + ","
										+ description + "," + n.minimumScore + ",," + matchStats.get("longestMatch") + ","
										+ matchLength + "," + codes[rejectCode];
							}
							// mismatch is not due error in digital sequence (e.g., unsupported residue)
							// start traversing to the root with Node n, which is a child of the Node to be
							// evaluated
							Node testNode = leafNode.parent;
							int rank = testNode.rank;

							int prunedMatchLength = -1;

							// Assign mismatched leaves if e > 4

							Map<String, Node> trialNodes = canonicalRankList.get(rank);
							Map<String, Integer> rowScores = new HashMap<String, Integer>();
							// score the parent (testNode) of mismatched leaf node (n)
							if (v > 2)
								System.out.printf("\n\n** Testing exposed leaf %s (rank %d) of pruned probe path starting at leaf residue %s",
										testNode.nodeID, rank, n.nodeID);
							prunedScore = scoreOneLeaf(trialNodes, testNode, matchMode, rowScores, mismatchMap, false); 

							// a prunedScore of zero exits the while loop, but first save the result
							if (prunedScore == 0) {
								// assign canonical nodes to each probe node in the path to the root, but do
								// not if the (partial) path is already assigned
								// prunedMatchLength = testNode.rank;
								if (n == leafNode) {
									// found matching path starting at real leaf Node
									rejectCode = 1;
								} else {
									// found matching path starting at some ancestor of mismatched leaf Node
									rejectCode = 2;									
								}

								reportString += "\n" + glycanID + "," + totalScore + "," + n.nodeID + "," + n.rank
										+ ",pruned path matches," + n.minimumScore + "," + testNode.rank + ","
										+ matchStats.get("longestMatch") + "," + matchLength + "," + codes[rejectCode];
								// reject code = 1 meqns that the structure is not rejected, ONLY leaves mismatch
								
								if (extendMode > 0) {
									// map internal residues to canonical tree even if leaf does not match
									assignCanonicalNode(testNode);
								}
								
								if (extendMode == 5) {
									// add to list of leaves to add to canonical tree
									// Use extendMode = 5 ONLY for (partially mapped) structures that are
									// known to be correct and appropriate
									// extend the canonical tree by adding Node n.
									nodes2add.add(leafNode);
								}
							} else {
								// matching path to root not found (internal mismatch)
								if (v > 2) {
									System.out.printf(
											"\nPruned path starting at %s [%d] does not match for glycan %s (initial start Node %s [%d]) - extendMode is %d\n",
											testNode.nodeID, testNode.rank, glycanID, n.nodeID, n.rank, extendMode);
								}
								rejectCode = 2; // -> internal mismatch found
							}  
							// increment node traversal here 
							leafNode = testNode;
						}  // end while loop

					}
				}

			}

			Boolean processFiles = false;
			if (v > 0) System.out.printf("\nrejectCode: %d", rejectCode);
			switch (rejectCode) {
			case 10: // the input file is corrupted
				if (v > 0)
					System.out.printf(" Input file is corrupted - process aborted for\n   %s\n", glycanFileName);
				processFiles = false;
				break;
			case 9: // The glycan is too short (DP < matchLength)
				if (v > 0)
					System.out.printf(" Longest path in glycan is %d but matchLength is %d: process aborted for\n   %s\n", maxRank,
							matchLength, glycanFileName);
				processFiles = false;
				break;
			case 8: // No possible paths with DP >= matchLength found
				if (v > 0)
					System.out.printf(" *** No glycan path with length >= %d matches canonical tree: process aborted for\n   %s\n",
						matchLength, glycanFileName);
				processFiles = false;
			break;
			case 7:
				if (v > 0)
					System.out.printf(" *** Digital description of glycan contains a residue name that is unsupported\n  %s\n",
							 glycanFileName);
				processFiles = false;
				break;
			case 3:
				if (v > 0)
					System.out.printf(" *** Glycan %s has a residue that does not match the tree described in\n   %s\n", 
						glycanID, canonicalNodeFileName);
				if (extendMode > 0) processFiles = true;
				break;
			case 2:
				if (v > 0)
					System.out.printf(" *** Glycan %s has an INTERNAL residue that does not match the tree described in\n   %s\n", 
						glycanID, canonicalNodeFileName);
				if (extendMode > 0) processFiles = true;
				break;
			case 1:
				if (v > 0)
					System.out.printf(" *** Glycan %s has an unmapped residue that can extend the canonical tree described in\n  %s\n", 
						glycanID, canonicalNodeFileName);
				if (extendMode > 0) processFiles = true;
				break;
			case 0:
				if (v > 0)
					System.out.printf(" *** Glycan %s matches perfectly with the tree described in\n   %s\n", 
						glycanID, canonicalNodeFileName);
				processFiles = true;
				break;
			default:
				if (v > 0)
					System.out.printf(" *** No rejection code available for glycan %s with the tree described in\n %s", 
						glycanID, canonicalNodeFileName);
				processFiles = false;
			}
		
			if (processFiles) {
				// this glycan structure WILL be written out as a csv file, and new canonical
				// nodes will be saved if extendMode > 0
				if (extendMode > 4) {
					// process list nodes2add (canonical nodes to add)
					// The following loop MUST be executed before writing the structure to a csv
					// file
					for (int i = 0; i < nodes2add.size(); i++) {
						// System.out.printf("\n", args);
						String newID = getNextId(canonicalNodes);
						extensionString += addLeaf(nodes2add.get(i), idPrefix, newID, glycanID);
					}
					if (v > 4) {
						System.out.printf("\n* Processing new canonical leaves for glycan %s\n Current list:\n%s",
								glycanID, extensionString);
						listLeaves(canonicalLeaves);
					}
				}
				if (v > 0)
					System.out.printf("\n\n* Generating CSV (%s) *\n", outFileName);
				csvRejectCode = writeCSV(probeNodes, outFileName, glycanID, reportString);

			}
			// arguments: glycan_ID,total score,mismatched leaf ID,rank,description,path
			// score,rejection code,longest pruned path, longest path,threshold";
			if (rejectCode < 10) {
				reportString += "\n" + glycanID + "," + totalScore + ",summary,-,-," + ",-,"
						+ matchStats.get("longestMatch") + "," + matchLength + "," + codes[rejectCode];
			} else {
				reportString += "\n" + glycanID + ",-1,summary,-,-," + ",-,"
						+ "null," + matchLength + "," + codes[rejectCode];
			}
		}

		if (foundAfile) {
			if (v > 0)
				System.out.printf("\n\n* Writing to Report file (%s) *", mismatchFileName);
			writeData(reportString, mismatchFileName);
			if ( (v > 0) && (extendMode > 4) ){
				System.out.printf("\n\n* Extension of canonical tree written to file (%s)", extensionFileName);
				System.out.printf("\n Current list of nodes to be added:\n%s", extensionString);
			}
			writeData(extensionString, extensionFileName);
		} else {
			System.out.printf("\n### No data files found that match command-line arguments ###\n");
		}

	} // end of main()

	/**
	 * Generates a list of file names by reading an input file whose name is specified by the String fn
	 * @param fn A String containing the name of a file listing fully-specified input (csv) files  
	 * @return An ArrayList containing names of csv input file for processing
	 */
	public static ArrayList<String> parseListFile(String fn) {
		ArrayList<String> result = new ArrayList<String>();
		File file = new File(fn);
		if (file.exists()) {
			try {
				Scanner input = new Scanner(file);
				while (input.hasNext()) {
					String line = input.next();
					result.add(line);
					if (v > 5)
						System.out.printf("\nAdding file %s to list", line);
				}
				input.close();
			} catch (FileNotFoundException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		} else {
			System.out.printf("file %s does not exist", fn);
		}
		return (result);
	} // end of parseListFile

	/**
	 * Aligns each structure Leaf Node in leafMap to canonical Nodes that have the same rank, then calls scoreOneLeaf() method for
	 * each alignment, saving match scores and mismatched leaves 
	 * @param mode integer (passed to scoreOneLeaf) specifying matching mode (see {@link #main(String[])} )
	 * @param leafMap HashMap containing the leaf Nodes of the structure
	 * @param cRanks HashMap containing canonical Nodes, indexed by rank
	 * @param mismatchMap HashMap containing mismatches
	 * @param updateMismatches Boolean specifying whether mismatches are added to mismatchMap
	 * @return an integer specifying the total of all leaf scores
	 * @see #scoreOneLeaf(Map, Node, int, Map, Map, Boolean)
	 */
	public static int getPathScores(int mode, Map<String, Node> leafMap,
			Map<Integer, Map<String, Node>> cRanks,
			Map<String, Node> mismatchMap, Boolean updateMismatches) {
		if (v > 1)
			System.out.printf("\n* Calculating leaf-to-root path scores *\n");
		int totalScore = 0;
		// int count = 0;
		// scores.clear();
		// set up probe leaf nodes
		for (Map.Entry<String, Node> e1 : leafMap.entrySet()) {
			Node tn = e1.getValue();
			// key1 is the nodeID of node n1
			String key1 = e1.getKey();
			// create a vector comprising the row that corresponds to the probe node and
			// put it into the matrix
			Map<String, Integer> rowScores = new HashMap<String, Integer>();
			// scores.put(key1, rowScores);
			int rank = tn.rank;
			// get a list of cannonical nodes with the same rank as the current leaf node
			Map<String, Node> trialNodes = null;
			if (cRanks.get(rank) == null) {
				System.out.printf("\nTesting leaf with rank %d, but no canonical residues have this rank\n", rank);
				if ((updateMismatches) && (!mismatchMap.containsKey(tn.nodeID)))
					mismatchMap.put(tn.nodeID, tn);

				// totalScore += rank;
			} else {
				trialNodes = cRanks.get(rank);
				// test the current probe leaf node and add its minimum score to the score for
				// the whole glycan
				totalScore += scoreOneLeaf(trialNodes, tn, mode, rowScores, mismatchMap, updateMismatches);
			}
		}
		return (totalScore);
	}

	/**
	 * calculates the score for one leaf of the probe structure by comparing its
	 * traversal to the root against all possible parallel canonical traversals,
	 * each of which starts with a canonical node having the same rank as the probe leaf
	 * 
	 * @param trialNodes
	 *            HashMap containing canonical nodes with the same rank as the
	 *            probe node
	 * @param leafNode
	 *            the leaf Node that is being compared to the canonical trial nodes
	 * @param mode integer (passed to scorePathPair) specifying matching mode - see {@link #main(String[])}
	 * @param rowScores
	 *            a HashMap containing one score for each element of the trialNodes
	 *            map
	 * @param mismatchMap
	 *            a HashMap containing leaf nodes whose path scores are not zero for
	 *            any trialNode
	 * @param updateMismatches
	 *            a Boolean specifying whether the mismatchMap should be updated
	 * @return the mimimum (best) score for the leafNode
	 * @see #scorePathPair(Node, Node, int)
	 */
	public static int scoreOneLeaf(Map<String, Node> trialNodes, Node leafNode, int mode,
			Map<String, Integer> rowScores, Map<String, Node> mismatchMap, Boolean updateMismatches) {
		// test each of these nodes - lower scores are better, like golf
		int minScore = 10000;
		String matchingLeafKey = "";

		if (v > 2)
			System.out.printf("\nScoring leaf node %s (mode %d). Number of trial Nodes is %d", leafNode.nodeID, mode, trialNodes.size());
		if (trialNodes.size() > 0)
			for (Map.Entry<String, Node> e2 : trialNodes.entrySet()) {
				String key2 = e2.getKey();
				Node cn = e2.getValue(); // cn is the cannonical node with the same rank as the leaf being processed
				// compute score by traversals initiated at the leafNode
				int score = scorePathPair(leafNode, cn, mode); // mode 0: any mismatched node is given a score of 1
				// put the score Integer into the row
				rowScores.put(key2, score);
				// count++;
				if (v > 2)
					System.out.printf(
							"\n### Path starting at %s (%d) vs path starting at %s (%d): total score is %d\n",
							leafNode.nodeID, leafNode.rank, key2, cn.rank, 1 * rowScores.get(key2));
				if (score < minScore)
					minScore = score;
				// Assign canonical node to the current node if the path score for this node is
				// zero
				if (score == 0) {
					if (v > 2)
						System.out.printf("\nAssigning canonical node %s to %s", cn.nodeID, leafNode.nodeID);
					leafNode.canonicalNode = cn;
					matchingLeafKey = key2;
					break; // no need to look any further - found exact match...
				}
			}
		else {
			if (v > 2)
				System.out.printf("\n Path starting at %s (%d) is longer than longest canonical path\n",
						leafNode.nodeID, leafNode.rank);
		}
		leafNode.minimumScore = minScore;
		if (minScore == 0) {
			if (v > 2)
				System.out.printf("\nleaf %s matches leaf %s (score = %d)\n", leafNode.nodeID, matchingLeafKey,
						minScore);
		} else {
			if (v > 2)
				System.out.printf("\nleaf %s does not match\n", leafNode.nodeID);
			if ((updateMismatches) && (!mismatchMap.containsKey(leafNode.nodeID)))
				mismatchMap.put(leafNode.nodeID, leafNode);
		}
		return (minScore);
	}

	/**
	 * Recursive method to calculate score of one Node pair (probe, canonical) - recursion traverses parallel paths to roots
	 * @param one a (usually leaf) Node whose path to the root is to be scored
	 * @param theOther a Node (usually canonical, with matching rank) initiating the canonical path to root
	 * @param mode integer (passed to one.compareTo() ) specifying matching mode - see {@link #main(String[])}
	 * @return an integer specifying the path matching (0: perfect)
	 * @see glycoTree.Node#compareTo(Node, int, int)
	 */
	public static int scorePathPair(Node one, Node theOther, int mode) {
		int score = 1;
		try {
			if (one.parent == null) {
				if (one.parentID.matches("0") ) {
					// Node one is the root Node
					// enable use of fuzzy matching (mode > 0) only for root Node of probe
					score = one.compareTo(theOther, mode, v);
				} else {
					// Node one is an internal Node (one.parentID is "x"), i.e., from "UND" section of GlycoCT
					score = 9;
				}
			} else {
				// use exact matching (mode = 0) for all other Nodes of probe
				score = one.compareTo(theOther, 0, v);
			}

			// RECURSIVE! calculates score for entire path from starting node to root
			// one and theOther must have same rank and both must have parents (aglycons) to traverse
			if ((one.parent != null) && (theOther.parent != null))
				score += scorePathPair(one.parent, theOther.parent, mode);

		} catch (Exception e) {
			// @@@ System.out.printf("\n\nPath comparison error for nodes %s and %s\n%s\n",
			// one, theOther, e);
		}
		return (score);
	}

	/**
	 * Lists children of all Nodes in map to StdOut
	 * @param map a HashMap containing all Nodes whose children should be listed
	 */
	public static void listChildren(Map<String, Node> map) {
		for (Map.Entry<String, Node> entry : map.entrySet()) {
			Node n = entry.getValue();
			System.out.printf("\nChildren of node %s:", n.nodeID);
			for (Map.Entry<String, Node> subEntry : n.children.entrySet()) {
				Node child = subEntry.getValue();
				System.out.printf(" %s", child.nodeID);
			}
		}
	}

	/**
	 * Generates a HashMap (leafMap) containing leaf Nodes of structure whose Nodes comprise another Map (map)
	 * @param map the Map comprising all of the nodes in a structure (or canonical tree)
	 * @param leafMap a Map containing all of the leaf Nodes in the structure
	 */
	public static void createLeafList(Map<String, Node> map, Map<String, Node> leafMap) {
		for (Map.Entry<String, Node> entry : map.entrySet()) {
			Node n = entry.getValue();
			if (n.children.isEmpty()) {
				if (v > 4)
					System.out.printf("\nLeaf %s added to list", n.nodeID);
				leafMap.put(n.nodeID, n);
			}
		}
	}

	/**
	 * Recursive method to assign all Nodes corresponding canonical Nodes in parallel pathways from Node n to the root 
	 *  - requires previous assignment of the canonical Node corresponding to Node n
	 * in order to initiate the parallel traversal, which in turn requires that the matching score of path corresponding
	 * to Node n is 0.
	 * 
	 * @param n a Node whose canonical Node has already been assigned
	 */
	public static void assignCanonicalNode(Node n) {
		// for THIS (probe) leaf, assign canonical nodes in path to root
		Node canonicalMatch = n.canonicalNode;
		if (v > 1)
			System.out.printf("\n Assigned canonical node %s to probe node %s", canonicalMatch.nodeID, n.nodeID);
		if ((n.parent != null) && (n.parent.canonicalNode == null)) {
			// assign the canonical node of Node n's parent to be the parent of the
			// canonical node assigned to Node n
			// no need to do this if n.parent is assigned (so its ancestors are also
			// assigned)
			n.parent.canonicalNode = canonicalMatch.parent;
			// recursion to the root node
			assignCanonicalNode(n.parent);
		}
	} // end of assignCanonicalNode

	/**
	 * Assigns canonical Nodes to all residues in paths from Nodes in the leafMap to the root - justified
	 * because paths to root from all Nodes in leafMap have a score of 0
	 * @param leafMap a Map comprised of Nodes whose paths to the root have a score of 0 
	 * @return a Map comprising Strings describing the number of mismatches and their identities
	 */
	public static Map<String, Integer> processPaths(Map<String, Node> leafMap) {
		// for each (probe) leaf, assign canonical nodes in path to root
		Map<String, Integer> result = new HashMap<String, Integer>();
		result.put("mismatchCount", 0);
		result.put("longestMatch", 0);
		for (Map.Entry<String, Node> entry : leafMap.entrySet()) {
			Node n = entry.getValue();
			if (n.canonicalNode != null) {
				// @@@ ???
				if (n.rank > result.get("longestMatch"))
					result.put("longestMatch", n.rank);
				// if a leaf node has an assigned canonical node, all of the nodes in its path
				// to the root can be assigned
				if (v > 3)
					System.out.printf("\n\n Leaf node %s matched to %s", n.nodeID, n.canonicalNode.nodeID);
				// (recursively) assign all nodes in path to root to canonical nodes
				assignCanonicalNode(n);
			} else {
				if (v > 1)
					System.out.printf("\n\n * Leaf node %s not matched *", n.nodeID);
				result.put("mismatchCount", result.get("mismatchCount") + 1); // increment the mismatchCount
			}
		}
		return (result);
	}

	/**
	 * Writes string reportStr to file instantiated with fileName
	 * @param reportStr the String to be written
	 * @param fileName the name of the file to be written to
	 */
	public static void writeData(String reportStr, String fileName) {
		if (v > 3)
			System.out.printf("\n# Writing to file: %s", fileName);
		try {
			BufferedWriter w = new BufferedWriter(new FileWriter(fileName));
			// FileWriter w = new FileWriter("out.csv", true);
			w.write(reportStr);
			w.close();
		} catch (IOException e) {
			e.printStackTrace();
			System.out.printf("IO exception for file %s\n", fileName);
		}
	}

	/**
	 * determines whether all the parameters defining a Node are complete
	 * @param n the Node to be checked for completeness
	 * @return a Boolean, true if fully defined
	 */
	public static Boolean isFullyDefined(Node n) {
		// are all the components of the node defined?
		if (n.nodeID == null)
			return (false);
		if (n.residueName == null)
			return (false);

		// other Node parameters to check? site parentID parent canonicalNode children
		// rank
		if (n.archetype == null)
			return (false);
		if (n.archetype.anomer.compareTo("x") == 0)
			return (false);
		if (n.archetype.anomer == null)
			return (false);
		if (n.archetype.absolute.compareTo("x") == 0)
			return (false);
		if (n.archetype.absolute == null)
			return (false);
		if (n.archetype.ring.compareTo("x") == 0)
			return (false);
		if (n.archetype.ring == null)
			return (false);
        if (n.archetype.sugar == null) {
			return (false);
        } else { 
        	if (n.archetype.sugar.name == null)
        		return (false);
        	if (n.archetype.sugar.color == null)
        		return (false);
        	if (n.archetype.sugar.shape == null)
        		return (false);
        	if (n.archetype.sugar.synonymPC == null)
        		return (false);
        }
        if (n.site.compareTo("-1") == 0)
			return (false);

		// otherwise ...
		if (v > 3)
			System.out.printf("\nnode %s is fully defined", n);
		return (true);
	} // end of isFullyDefined()

	/**
	 * Adds a new canonical leaf Node to the canonical leaf Map and generates a string that can be written
	 * to a file that is used to extend the canonical tree for future use
	 * @param n the Node that should be added to the canonical Node list
	 * @param prefix a string containing the prefix for the new canonical Node name
	 *  (e.g., "N" for the N-glycan tree)
	 * @param newID a string specifying the (partial) ID of the new canonical Node (e.g., "E199")
	 * @param glycanID a String holding the ID of the glycan that is the source of the new canonical Node
	 * @return a csv formatted string describing the new canonical Node
	 * @see #isFullyDefined(Node)
	 */
	public static String addLeaf(Node n, String prefix, String newID, String glycanID) {

		String extStr = "";

		// first, check to see whether the leaf is fully defined
		if (isFullyDefined(n)) {
			NodeArchetype na = n.archetype;
			String canonicalName = prefix + "-glycan_" + na.anomer + "-" + na.absolute + "-" + n.formName;

			if (v > 2)
				System.out.printf("\n* New canonical residue: %s with ID %s", canonicalName, n.nodeID);
			n.residueName = canonicalName + "_" + newID;
			n.nodeID = prefix + newID;
			// make a copy of node n to put into the canonical node list
			// this copy can now be modified to make sure its parent is a bona fide canonical Node, NOT a
			// probe node
			Node nCopy = n.copy();
			if (n.parent.canonicalNode != null) {
				// if the parent of Node n has been assigned (mapped to) a canonical Node
				// set the parent of the copy to that canonical Node to integrate the new Node into the canonical tree
				// initially the parent of Node nCopy is not a canonical Node;
				//  this parent is initially a non-canonical Node that has merely had a canonical Node assigned to it
				nCopy.parent = n.parent.canonicalNode;
				// add the (modified) copy to the canonicalNodeMap
				canonicalNodes.put(nCopy.nodeID, nCopy);
				// the new canonical Node must be a leaf Node, so add it to the canonicalNodeLeafMap
				Node newOne = canonicalNodes.get(n.nodeID);
				canonicalLeaves.put(n.nodeID, n);
				// rebuild the canonicalRankList to facilitate finding canonical nodes with a
				// particular rank
				int maxRank = createRankList(canonicalNodes, canonicalRankList);
				if (v > 0) {
					if (v > 4)
						listRanks(canonicalRankList, maxRank);
					System.out.printf("\n* Added [%s, %s] to canonical tree as: %s", n.nodeID, n.residueName, newOne);
				}
				// prepare string to export the new canonical Node to a file describing extension of the canonical Node tree
				extStr = generateCSVstring(n, "canonical"); 

			} else {
				System.out.printf(
						"\n#### Error: Failed to assign canonical parent of canonical node %s (%s) for glycan %s###\n",
						n.nodeID, n.residueName, glycanID);
			}
		}

		// if data are complete, return newly generated extstr, else return empty string
		return (extStr);
	} // end of addLeaf()

	/**
	 * Prepares a String composed of comma-separated elements that describe a Node.
	 * When the string describes a Node that is part of the glycan being processed, the glycanID is passed,
	 * and this is prepended to the String.
	 * @param n the Node for which the string is prepared
	 * @param glycanID a String specifying the accession of the glycan containing the Node - if the string is
	 *  meant to be an extension of the canonical Node tree, this string is "canonical"
	 * @return a String describing the Node to be written to a csv file
	 */
	public static String generateCSVstring(Node n, String glycanID) {
		String csvString = "";

		String residueID = "";
		String residueName = "";
		if (n.canonicalNode != null) {
			residueID = n.canonicalNode.nodeID;
			residueName = n.canonicalNode.residueName;
		} else {
			residueID = n.nodeID;
			residueName = n.residueName;
		}
		String parentID = n.parentID;
		String site = n.site;
		if (n.parent != null) {
			if (n.parent.canonicalNode == null) {
				parentID = n.parent.nodeID;
			} else {
				parentID = n.parent.canonicalNode.nodeID;
			}
		}
		NodeArchetype na = n.archetype;
		SNFGSugar sug = na.sugar;

		// different format calls required because they have a different number of variables
		if (glycanID.compareTo("canonical") == 0) { // this data goes to a canonical tree extension csv file
			csvString = String.format("%s,%s,%s,%s,%s,%s,%s,%s,%s\n", residueName, residueID, n.nodeName,
					na.anomer, na.absolute, na.ring, parentID, site, n.formName);
		} else { // this data goes to a specific glycan csv file
			csvString = String.format("%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n", glycanID, residueName, residueID, n.nodeName, 
					na.anomer, na.absolute, na.ring, parentID, site, n.formName);
		}
		if (v > 4)
			System.out.printf("\nprepared csvString: %s", csvString);
		return (csvString);
	} // end of generateCSVstring

	/**
	 * Exports (as a csv file) the contents of a HashMap containing Nodes and their parameters for a specific structure.
	 * 
	 * @param nodeMap a HashMap comprised of Nodes
	 * @param fileName the file to write as csv
	 * @param glycanID the ID of the glycan described in the generated file
	 * @param reportString String containing additional information to be written to a separate report file
	 * @return an integer rejection code describing issues with the write process (0 if no issues)
	 */
	public static int writeCSV(Map<String, Node> nodeMap, String fileName, String glycanID, String reportString) {
		if (v > 1)
			System.out.printf("\n  Writing to output file (%s):\n", fileName);
		int rejectCode = 0;
		try {
			BufferedWriter w = new BufferedWriter(new FileWriter(fileName));
			// FileWriter w = new FileWriter("out.csv", true);
			w.write("glycan_ID,residue,residue_ID,name,anomer,absolute,ring,parent_ID,site,form_name\n");
			String comments = "";
			for (Map.Entry<String, Node> entry : nodeMap.entrySet()) {
				Node n = entry.getValue();

				try {
					String line = generateCSVstring(n, glycanID);
					w.write(line);
					if (v > 1)
						System.out.printf(" %s", line);
				} catch (NullPointerException e) {
					rejectCode = 99;
					System.out.printf(
							"\n\n **** Residue %s in %s may be missing (null) when creating csv file %s ***\n",
							n.residueName, glycanID, fileName);
					comments += glycanID + ",unassigned," + n.nodeID
							+ ",-,-,-,-,-/,-,-,-,-,residue missing from this file\n";
					reportString += "\n" + glycanID + "," + totalScore + ",-,-,-,-,-,-,-,-,9";
					e.printStackTrace();
				}

			}
			w.write(comments);
			w.close();
		} catch (Exception e) {
			e.printStackTrace();
		}
		return (rejectCode);
	}

	/**
	 * Writes a list of leaf Nodes to stdout in the form nodeID(rank) for each Node
	 * @param leafMap a Map comprising the leaf Nodes to be listed
	 */
	public static void listLeaves(Map<String, Node> leafMap) {
		int counter = 0;
		for (Map.Entry<String, Node> entry : leafMap.entrySet()) {
			if (counter % 8 == 0)
				System.out.print("\n");
			Node n = entry.getValue();
			System.out.printf("\t%s(%d)", n.nodeID, n.rank);
			counter++;
		}
	} // end of listLeaves()

	/**
	 * Creates a list (Map) of residue nodes, classified into sub-Maps, each
	 * containing the nodes of a particular rank<br>
	 * Each sub-Map can be recalled using the Integer corresponding to its rank
	 * 
	 * @param map input Map contains all of the nodes to be classified by rank
	 * @param list generated Map of Node Maps - the index of each Node Map is an integer (rank of comprising Nodes)
	 * @return the maximum rank (index) in list
	 */
	public static int createRankList(Map<String, Node> map, Map<Integer, Map<String, Node>> list) {
		// calculate dimensions of the rank list using the maximum rank for the
		// structure
		int maxRank = 1;
		for (Map.Entry<String, Node> entry : map.entrySet()) {
			Node n = entry.getValue();
			if (n.rank > maxRank)
				maxRank = n.rank;
		}

		// set up a list for each existing rank
		// reinitialize for multiple files
		list.clear();
		for (int i = 1; i < maxRank + 1; i++) {
			Map<String, Node> le = new HashMap<String, Node>();
			list.put(i, le);
		}

		// populate the lists
		for (Map.Entry<String, Node> entry : map.entrySet()) {
			Node n = entry.getValue();
			int rank = n.rank;
			list.get(rank).put(n.nodeID, n);
		}

		return (maxRank);
	} // end of createRankList()

	/**
	 * Returns a one-character string corresponding to the prefix for residue IDs
	 * imported into the current canonical tree from the GlycO ontology. For
	 * example, for N-glycans the prefix should be N and for O-glycans the prefix
	 * should be O.
	 * 
	 * @param map
	 *            a HashMap containing all of the Nodes (i.e., residues) in the
	 *            current canonical tree. The residue ID is the key for each element
	 *            in the HashMap. Canonical trees extended beyond GlycO contain
	 *            Nodes that have two characters in the prefix. For example, nodes
	 *            in the extended N-glycan tree have the prefix "NE"
	 * @return a String specifying the canonical ID prefix (e.g., "N" for N-glycans)
	 */
	public static String getIDprefix(Map<String, Node> map) {
		String prefix = "?";
		for (Map.Entry<String, Node> entry : map.entrySet()) {
			String thisID = entry.getKey();
			prefix = thisID.replaceAll("[0-9]*", "");
			if (prefix.length() == 1) { // the canonical prefix from GlycO is a single character
				return (prefix);
			}
		}
		return (prefix);  // if failed to get prefix from canonical tree
	} // end of getIDprefix

	/**
	 * Searches through Map containing Nodes to find the last (highest numbered)
	 * extended canonical ID, adds 1 to the numeric part, and returns the result as
	 * the next extended canonical ID to be used.
	 * 
	 * @param map
	 *            the HashMap containing the canonical nodes
	 * @return the next extended canonical Node ID (e.g., "NE8") to be used
	 */
	public static String getNextId(Map<String, Node> map) {
		String nextID = "";
		// check numerical value of last extended residue ID
		int maxID = 0;
		for (Map.Entry<String, Node> entry : map.entrySet()) {
			String thisID = entry.getKey();
			if (thisID.indexOf("E") > 0) { // this Node has an extended ID prefix
				// get the numerical part of the ID
				int suffix = Integer.valueOf(thisID.replaceAll("[a-zA-Z]*", ""));
				maxID = Math.max(maxID, suffix);
			}
		}

		nextID = "E" + (maxID + 1);
		if (v > 2)
			System.out.printf("\n* Determined the next canonical residue ID: %s", nextID);
		return (nextID);
	} // end of getLastId()

	/**
	 * Prints Nodes in Map list according to their rank (index)
	 * @param list an integer-indexed Map of Maps,
	 * @param maxRank an integer specifying the upper limit of the indices of list
	 */
	public static void listRanks(Map<Integer, Map<String, Node>> list, int maxRank) {
		for (int i = 1; i < maxRank + 1; i++) {
			System.out.printf("\nNodes with rank %d :", i);
			Map<String, Node> sublist = list.get(i);
			for (Map.Entry<String, Node> entry : sublist.entrySet()) {
				Node n = entry.getValue();
				System.out.printf("  %s", n.nodeID);
			}
		}
	}// end of listRanks()

	/**
	 * Imports sugar specifications from a csv file describing SNFG sugar objects, and adds them to <i>sugarList</i>
	 * @param fn the name of the sugar file (csv)
	 * @return integer, 1 if successful reading file
	 * 
	 * @see #sugarList 
	 * @see glycoTree.SNFGSugar
	 */
	public static int importSugars(String fn) {
		File file = new File(fn);
		if (file.exists()) {
			try {
				Scanner input = new Scanner(file);
				String header = input.next();
				if (v > 4)
					System.out.printf("\n header:  %s\n", header);
				while (input.hasNext()) {
					String line = input.next();
					String[] vals = line.split(",");
					// if (v > 6) System.out.printf("\n\n@@@@%s  ->  %s\n", line, vals[0]);
					sugarList.add(new SNFGSugar(vals[0], vals[1], vals[2], vals[3], vals[4], vals[5]));
				}
				input.close();
			} catch (FileNotFoundException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				return (0);
			}
		} else {
			System.out.printf("file %s does not exist", fn);
			return (0);
		}
		return (1);
	} // end of importSugars()

	/**
	 * Imports data from a csv file, populating nodeMap, which is a Map containing
	 * archetype nodes corresponding to each residue in the input file. Archetype
	 * nodes are generated here, and compared to a list of previously defined
	 * archetype nodes, which are held in ArrayList archs. If the current node
	 * archetype is distinct from any archetype in archs, archs is appended with the
	 * new archetype.
	 * 
	 * @param fn
	 *            The name of the input csv file
	 * @param offset
	 *            used to distinguish a canonical node file (which has no glycan ID
	 *            column) from a specific structure node file (whose first column is
	 *            always the glycan's ID, e.g. a GlyTouCan ID)
	 * @param archs an ArrayList o NodeArchetypes to be populated by this method
	 * @param nodeMap a Map comprising Nodes to be populated by this method
	 * @return an integer specifying the number of NodeArchetypes added to <i>archs</i>
	 */
	public static int importData(String fn, int offset, ArrayList<NodeArchetype> archs, Map<String, Node> nodeMap) {
		int missedNodes = 0;
		File file = new File(fn);
		if (file.exists()) {
			try {
				Scanner input = new Scanner(file);
				String header = input.next();
				if (v > 4)
					System.out.printf("\nFile Header: %s", header);
				while (input.hasNext()) {
					String line = input.next();
					String[] vals = line.split(",");
					// need to bail if vals.length() < offset + 8
					if (vals.length < offset + 9) return -1;
					String glycanID = vals[0]; // not used when offset == 0
					String residueName = vals[offset + 0];
					String nodeID = vals[offset + 1];
					String nodeName = vals[offset + 2];
					String sugarName = nodeName.split("-")[0];
					String anomer = vals[offset + 3];
					String absolute = vals[offset + 4];
					String ring = vals[offset + 5];
					String parentID = vals[offset + 6];
					String site = vals[offset + 7];
					String formName =  vals[offset + 8];

					if (v > 4)
						System.out.printf(
								"\n\nData: %s\n Node Name: %s; Node ID: %s; nodeName: %s; sugarName: %s; anomer: %s;"
										+ " absolute: %s; ring: %s; parent: %s; site %s; formName %s\n",
								line, residueName, nodeID, nodeName, sugarName, anomer, absolute, ring, parentID, site, formName);

					// first create archetype, if new, add to archetype list
					NodeArchetype na = new NodeArchetype(sugarList, sugarName, anomer, absolute, ring);
// for (int q=0; q<na.size(); q++) System.out.printf("\n@@@ archetype: %s", na.get(q));
					if ((v > 3) && (na.sugar == null))
						System.out.printf(" Error: Cannot assign an SNFG Sugar to %s from file %s\n", sugarName, fn);

					if (v > 5) {
						System.out.printf(" Creating a temporary archetype for %s (%s) (%s: %s-%s-%s-%s)\n",
								residueName, nodeID, na, na.anomer, na.absolute, na.sugar.name, na.ring);
					}
					Boolean archIsNew = true;
					NodeArchetype matchingArchetype = null;
					try {
						for (int i = 0; i < archs.size(); i++) {
							NodeArchetype cna = archs.get(i);
							if (na.compareTo(cna, EXACT_MATCH, v) == 0) {
								archIsNew = false;
								matchingArchetype = cna; // save to add to node after its declaration (later)
								if (v > 4) {
									System.out.printf(" %s (%s) already has an archetype (%s: %s-%s-%s-%s)\n",
											residueName, nodeID, cna, cna.anomer, cna.absolute, cna.sugar.name,
											cna.ring);
								}
								i = archs.size(); // no need to look further
							}
						}

						if (archIsNew) {
							archs.add(na);
							if (v > 4)
								System.out.printf(
										" New Node Archetype (%s [%s]):\n   %s-%s-%s-%s\n", na, na.sugar, 
										na.anomer, na.absolute, na.sugar.name, na.ring);
						}
					} catch (NullPointerException e) {
						e.printStackTrace();
					}

					Node n = new Node(na, residueName, nodeID, site, nodeName, parentID, formName);
					if (!archIsNew) {
						// if archetype already exists, use that archetype for this node
						n.archetype = matchingArchetype; 
					}
					nodeMap.put(nodeID, n);
					if (v > 4)
						System.out.printf(" New Node %s %s with name [%s], canonical name [%s], formName [%s],\n  and parent %s, linked at position %s",
								nodeID, nodeMap.get(nodeID), n.archetype.sugar.name, n.residueName,  n.formName,
								nodeMap.get(nodeID).parentID, nodeMap.get(nodeID).site);
				}
				input.close();
			} catch (FileNotFoundException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
				return (0);
			} catch (ArrayIndexOutOfBoundsException e) {
				System.out.printf("\nArray index out of bounds for file %s (offset is %d)\n", fn, offset);
				e.printStackTrace();
			}
		} else {
			System.out.printf("file %s does not exist", fn);
			return (0);
		}

		if (v > 4)
			System.out.printf("\n\n* Imported Nodes *");

		// set all parents and children
		for (Map.Entry<String, Node> entry : nodeMap.entrySet()) {
			Node n = entry.getValue();
			if (v > 4)
				System.out.printf("\n node[%s] has parentID %s", n.nodeID, n.parentID);
			if (nodeMap.get(n.parentID) != null) { // @@@ this if logic needs fixin'
				n.setParent(nodeMap);
				if (v > 4)
					System.out.printf("\n   assigned parent for Node %s (%s): parent %s (%s) substituted at %s", n.nodeID, n,
							nodeMap.get(n.parentID).nodeID, nodeMap.get(n.parentID), n.site);
				// add node n as a child of its parent (just assigned)
				n.parent.children.put(n.nodeID, n);
			} else {
				if (v > 4)
					System.out.printf("\n   Node %s (%s) has no parent", n.nodeID, n);
			}

		}

		// need to set all parents before setting ranks
		if (v > 4)
			System.out.printf("\n");
		for (Map.Entry<String, Node> entry : nodeMap.entrySet()) {
			Node n = entry.getValue();
			String leafString = " ";
			if (n.children.isEmpty())
				leafString = " (leaf) ";
			int rr = n.setRank();
			if (v > 4)
				System.out.printf("\nNode %s%s(%s) rank -> %d", n.nodeID, leafString, n, rr);
		}

		return (archs.size());

	} // end of importData()

	/**
	 * Prints a list of NodeArchetypes to stdout
	 * @param archs an arrayList of NodeArchetypes to be printed
	 * 
	 * @see glycoTree.NodeArchetype
	 */
	public static void showArchetypes(ArrayList<NodeArchetype> archs) {
		System.out.printf("\n\n* Node Archetypes *");
		for (int i = 0; i < archs.size(); i++) {
			NodeArchetype cna = archs.get(i);
			System.out.printf("\n%d: (%s) %s-%s-%s-%s", i, cna, cna.anomer, cna.absolute, cna.sugar.name, cna.ring);
		}
	} // end of showArchetypes()

	// internal class
	public class GTCException extends Exception {
		public GTCException(String message) {
			super(message);
		}
	}
}
