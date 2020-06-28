package gctTOcsv;

import java.awt.List;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.PrintWriter;
import java.io.UnsupportedEncodingException;
import java.lang.reflect.Array;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Scanner;
import java.util.SortedSet;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * Converts GlycoCT encoding into glycoTree csv encoding, without using eurocarbDB libraries. 
 * This is not meant to be inclusive of all types of glycans (like bacterial glycans), but is rather
 * limited to glycans that are amenable to specification by mapping to canonical tree structures.<br>
 * Input parameters are described in the main() method documentation.
 * 
 * @author wsyork
 *
 */
public class GenerateCSV {


	/**
	 * the verbosity of the output to stdOut
	 */
	static int v = 0;
	
	/**
	 * the String holding the csv encoding
	 */
	static StringBuilder csvStr = null; 

	/**
	 * the core processing method.
	 * @param args the command-line arguments for invoking the GenerateCSV class.<br>
	 * Usage: GenerateCSV.jar input_file [list | single (default)] [verbosity (default = 0)]<br>
	 *  the input_file can be a single GlycoCT file of a list of GlycoCT files<br>
	 */
	public static void main(String[] args) {

		// parse arguments
		if (args.length < 1) {
			System.out.println("Usage: GenerateCSV.jar input_file [list | single (default)] [verbosity (default = 0)]");
			System.exit(0);
		}
		String infile = args[0];

		v = Integer.valueOf(args[2]);
		if (v > 0) System.out.printf("\nverbosity is %d", v);

		ArrayList<String> files = new ArrayList<String>();
		if (args[1].compareTo("list") == 0) {
			// open and parse the list file, putting elements in the ArrayList "files"
			files = getInputFileLines(infile);
			System.out.printf("\nUsing a list (%s) of input files\n", infile);
		} else {
			// just use the argument as a single GlycoCT input file
			files.add(infile);
		}

		// LOOP THROUGH ALL INPUT FILES
		for (Iterator<String> f_iter = files.iterator(); f_iter.hasNext();) {
			String theFile = f_iter.next();
			if (v > -1) System.out.printf("\nGlycoCT input file is %s", theFile);
			
			Map<String, Map<String, String>> residueList = new HashMap<String, Map<String, String>>();
			Map<String, String> substituentList = new HashMap<String, String>();

			
			try {
				// get GlycoCT string from file
				ArrayList<String> gtcLines = new ArrayList<String>();
				gtcLines = getInputFileLines(theFile);
				String whichSection = "none";

				for (Iterator<String> cgt_iter = gtcLines.iterator(); cgt_iter.hasNext();) {
					String gtcLine = cgt_iter.next();
					// whichSection is modified by parseGTCline - but ONLY when line is "RES" or "LIN"
					// otherwise parseGTCline parses the line and returns the same value of whichSection
					whichSection = parseGCTline(gtcLine, whichSection, residueList, substituentList);
				}

				// find the index of the root of the structure tree
				System.out.printf("\n\nfinding root residue ..");
				String rootID =  getRoot(residueList);
				// assign "0" to root's parent and link_position
				if (v > 5) System.out.printf("\n\n rootID is %s", rootID);
				residueList.get(rootID).put("parent", "0");
				residueList.get(rootID).put("link_position", "0");
				
			
				// grab the glycan's name from the input file name 
				Path path = Paths.get(theFile);
				String fileName = path.getFileName().toString();
				String outDir = path.getParent().toString() + "/csv/";
				String glycanName = fileName.substring(0, fileName.indexOf(".") );

				// generate csvStr
				csvStr = new StringBuilder("glycan_ID,residue,residue_ID,name,anomer,absolute,ring,parent_ID,site,formName");

				for (String k1 : residueList.keySet()) {
					// ToDo: check if each res element has an apropriate value ... otherwise append appropriate default value (e.g., "0" or "x")
					Map<String, String> res = residueList.get(k1);
					csvStr.append("\n" + glycanName + ",unassigned," + k1) ;
					
					appendCSVstr(res.get("name"), "none", csvStr);
					appendCSVstr(res.get("anomer"), "x", csvStr);
					// since the following line generates a substring, it must be first checked
					if ( (res.get("absConfig") != null) && (!res.get("absConfig").isEmpty() ) ) 
						appendCSVstr(res.get("absConfig").substring(0, 1), "x", csvStr);
					appendCSVstr(res.get("ring"), "x", csvStr);
					appendCSVstr(res.get("parent"), "x", csvStr);
					appendCSVstr(res.get("link_position"), "x", csvStr);
					appendCSVstr(res.get("formName"), "none", csvStr);
					/*
					csvStr.append("," + res.get("name")) ;
					csvStr.append("," + res.get("anomer")) ;
					csvStr.append("," + res.get("absConfig").substring(0, 1)) ;
					csvStr.append("," + res.get("ring")) ;
					csvStr.append("," + res.get("parent")) ;
					csvStr.append("," + res.get("link_position")) ;
					csvStr.append("," + res.get("formName")) ;
					*/
				}
				// csvStr is now complete, so write it out

				String outFile = outDir + glycanName + ".csv";
				if (v > 0) System.out.printf("\nCSV output written to file %s\n\n%s\n", outFile, csvStr);
				
				PrintWriter writer = new PrintWriter(outFile, "UTF-8");
				writer.println(csvStr);
				writer.close();

			} catch (FileNotFoundException e) {
				e.printStackTrace();
			} catch (UnsupportedEncodingException e) {
				e.printStackTrace();
			}
			
			if (v > 8) {
				for (String k1 : residueList.keySet()) {
					Map<String, String> res = residueList.get(k1);
					System.out.printf("\n\n## residue[%s] ##", k1);
					for (String k2 : res.keySet()) {
						System.out.printf("\n %s %s", k2, res.get(k2) );
					}
				}
				for (String k3 : substituentList.keySet()) {
					System.out.printf("\n\n substituent[%s]: %s", k3, substituentList.get(k3) );
				}
			}
			 
		}

	} // end of main

	public static void appendCSVstr(String value,  String defaultStr, StringBuilder csvStr) {
		if ( (value != null) && (!value.isEmpty() ) ) {
			csvStr.append("," + value);
		} else {
			csvStr.append("," + defaultStr);
		}
	}

	/**
	 * parses a line in the GlycoCT file, populating the resList and subList Maps, which hold the attributes
	 * of the residues and substituents
	 * @param gctLine the String holding the contents of a line from the GlycoCT file 
	 * @param section the GlycoCT section (RES | LIN)
	 * @param resList Map that holds the attributes of the residues
	 * @param subList Map that holds the attributes of the substituents
	 * @return a String holding the name of the GlycoCT section encoded by the gtcLine
	 */
	public static String parseGCTline(String gctLine, String section, Map<String, Map<String, String>> resList, Map<String, String> subList) {
		// if line is a section header (e.g., "RES"), just return the section currently with focus
		if (gctLine.matches("RES")) {
			return("RES"); // no data in this line
		}
		if (gctLine.matches("LIN")) {
			return("LIN"); // no data in this line
		}
		// catch different types of GlycoCT section headers
		if (gctLine.matches("UND.*")) {
			return("UND"); // no data in this line
		}

		// the following code is reachable if the section is "RES" or "LIN" or "UND"
		GCTparser gctParser = new GCTparser();

		int splitIndex = 0;
		String prefix = "";
		String suffix = "";
		String gctID = "";

		if ( (section.matches("RES") ) || (section.matches("LIN") ) ) {
			// parse the gctLine
			splitIndex = gctLine.indexOf(':');
			prefix = gctLine.substring(0, splitIndex);
			suffix = gctLine.substring(splitIndex+1, gctLine.length());
			gctID = prefix.split("[a-zA-Z]+")[0];
		}
		
		try {
			switch(section) {
			case "RES":
				String type = prefix.split("[0-9]+")[1];
				if (v > 1) System.out.printf("\n\nRES: id %s;  type %s", gctID, type);
				switch (type) {
				case "b":

					if (type.matches("b") ) {
						
						if (v > 6) System.out.printf("\ngctLine suffix is %s", suffix);
						Map<String, String> sugarAtts =  gctParser.parseBaseType(suffix, v);
						String sugarName = gctParser.getSugarName(sugarAtts);
						sugarAtts.put("name", sugarName);
						String formName = getFormName(sugarAtts);
						sugarAtts.put("formName", formName);
						sugarAtts.put("gctID", gctID);

						if (v > 2) {
							System.out.printf("\n[%s] ", suffix );
							for(String k : sugarAtts.keySet()) {
								String p = sugarAtts.get(k);
								System.out.printf(" %s %s;", k, p );
							}
						}
						resList.put(gctID, sugarAtts);
					}
					break;
				case "s":
					if (v > 2) {
						System.out.printf("\n[%s] ", suffix);
					}
					subList.put(gctID, suffix);
					break;
				}
				break;

			case "LIN":
				String[] parts = suffix.split("[\\(\\)]");
				String parentID = parts[0].replaceAll("[a-zA-Z].*", "");
				String childID = parts[2].replaceAll("[a-zA-Z].*", "");
				String linkPos = parts[1].split("[+-]")[0];
				if (v > 2) System.out.printf("\n\nLIN: [%s]: parentID %s; childID %s; link %s", suffix, parentID, childID, linkPos);
				if ( resList.containsKey(parentID) ) { // the parent is a residue
					if ( resList.containsKey(childID) ) { // the child is a residue
						Map<String, String> childNode = resList.get(childID);
						childNode.put("parent", parentID);
						childNode.put("link_position", linkPos);
					} else if (subList.containsKey(childID) ) { // the child is a substituent

						// extend parent name
						String pName = resList.get(parentID).get("name");
						String sName = subList.get(childID);

						String extName = gctParser.extendName(pName, sName, linkPos);
						if (v > 3) System.out.printf("\n extended parent residue name for substituent %s is %s", childID, extName);
						resList.get(parentID).replace("name", extName);
						// extend parent formName


						// !! Extend formName ONLY for N-substituents !!
						if (sName.contains("n-") ) {
							pName = resList.get(parentID).get("formName");
							extName = gctParser.extendName(pName, sName, linkPos);
							if (v > 3) System.out.printf("\n extended parent residue formName for substituent %s is %s", childID, extName);
							resList.get(parentID).replace("formName", extName);
						}
					}
				}
				break;
			case "UND" :
				break;
			default:
				break;
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		return(section);
	} // end of method parseGCTline()
	
	
	/**
	 * calculates the formName String, which includes the sugar name and its ring form
	 * @param query a Map holding the attributes of a specific sugar residue
	 * @return a String holding the sugar name and its ring form
	 */
	public static String getFormName(Map<String, String> query) {
		// query is a Map of attributes for a specific residue
		// do not include any chars in name after "-"
		String formName = query.get("name");
		for(String k : query.keySet()) {
			if (query.get(k).matches("[fp]") ) {
				formName = formName + query.get(k);
				return(formName);
			}
		}
		return(formName);
	} // end of method getFormName()
	
	
	/**
	 * retrieves the root residue of the structure tree
	 * @param resList a Map that holds the attributes of the residues in the structure tree
	 * @return the GlycoCT index of the root residue of the structure tree
	 */
	public static String getRoot(Map<String, Map<String, String>> resList) {
		// must order keys NUMERICALLY so first element without a parent is the root
		            
		Sorter mapSorter = new Sorter();
		String[] sortedArray = mapSorter.sortMapKeysNumeric(resList);
		
		// root is the first (numerically) residue having no parent
		if (v > 7) for (int i = 0; i < sortedArray.length; i++) {
			System.out.printf("\n residue[%s] has parent ID: %s", sortedArray[i], resList.get(sortedArray[i]).get("parent") );
		}
			
		for (int i = 0; i < sortedArray.length; i++) {
			Map<String, String> res = resList.get(sortedArray[i]);
			if (!res.containsKey("parent") ) {
				return(sortedArray[i]);
			}
			
		}

		return("1"); // by default
	} // end of method getRoot()
	
	
	/**
	 * generates a list of input files from a text file holding them
	 * @param fn the name of the list file
	 * @return a list of input files
	 */
	public static ArrayList<String> getInputFileLines(String fn) {
		ArrayList<String> result = new ArrayList<String>();
		File file = new File(fn);
		if (file.exists()) {
			try {
				Scanner input = new Scanner(file);
				while (input.hasNext()) {
					String line = input.next();
					result.add(line);
				}
				input.close();
			} catch (FileNotFoundException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		} else {
			System.out.printf("file %s does not exist", fn);
		}
		return(result);
	}	


	/**
	 * reads a text file, producing a single String
	 * @param fn the text file to read
	 * @return the text string with lines delimited by "\n"
	 */
	public static String readTextFile(String fn) {
		String text = "";
		File file = new File(fn);
		if (file.exists()) {
			try {
				Scanner input = new Scanner(file);
				while (input.hasNext()) {
					String line = input.next();
					text += line + "\n";
				}
				input.close();
			} catch (FileNotFoundException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		} else {
			System.out.printf("file %s does not exist", fn);
		}
		return(text);
	}	
	

}
