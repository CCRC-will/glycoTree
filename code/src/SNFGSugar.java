/**
 * 
 */
package glycoTree;

/**
 * 
 * SNFGsugar holds information about monosaccharide constituents of glycans with respect to their SNFG representations.
 * Specifically, each instance of this class holds the trivial name (e.g., Glc), color, and shape of the SNFG image
 * of a specific sugar.  This class also holds two synonyms (to facilitate sugar look-up) and the name of a closely related 
 * sugar with the same SNFG image. For example, "Glcol" is a quasi synonym of "Glc" because both are represented
 *  by a blue  circle.

 * @author wsyork
 */
public class SNFGSugar {
	/**
	 * the SFFG name of ghe sugar
	 */
	String name;
	
	/**
	 * the color of the SNFG image of the sugar
	 */
	String color;
	
	/**
	 * the shape of the SNFG image of the sugar
	 */
	String shape;
	
	/** 
	 * a synonym for the sugar, may be used by PubChem
	 */
	String synonymPC;
	
	/** another synonym of fhe sugar that may be used, e.g. "Neu5Ac" instead of 'NeuNAc
	 * 
	 */
	String synonym2;
	
	/**
	 * the name of a related sugar with the same SNFG image (e.., "Glcol" is quasi "Glc".)
	 */
	String quasi;
	
	public SNFGSugar(String name, String shape, String color, String synonymPC, String synonym2, String quasi) {
		super();
		this.name = name;
		this.color = color;
		this.shape = shape;
		this.synonymPC = synonymPC;
		this.synonym2 = synonym2;
		this.quasi = quasi;
	}
	
	public String getName() {
		return(this.name);
	}
	
	public String getColor() {
		return(this.color);
	}
	
	public String getShape() {
		return(this.shape);
	}
	
}
