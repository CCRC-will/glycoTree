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
 */
public class SNFGSugar {
	/**
	 * the SFFG name of the sugar
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
