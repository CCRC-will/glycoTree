package svgConvert;

/**
 * PathMapper maps an svg path rendering of a character to the corresponding character, font, font size, and offsets.
 * A digest of the path, defined in SVGflatten.mapChar(), is passed to PathMapper.for() method to retrieve these parameters.
 * Briefly, this digest is a String consisting of the number of data points in the path "d" element, followed by
 * the sequence of control characters [MLQZ] in "d".  This effectively maps the character while ignoring its absolute position
 * on the canvas.
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
 *
 */
public enum PathMapper {

	// constants specifying pre-defined pathMapper objects
	// still need to define 2S, 3S, and 6S
	FAIL("---", "0", "0", "0", "Serif", "12px"),
	
	THREESIX("3/6", "227MQQQQQQQQQQQQLLQQQQQQLLLQQQQQQLLZLLLLZQQQQQQQQZQQQQQQQQQQQQLLQQQQZ", "7", "8","Baskerville", "11px"),
	THREEFOUR("3/4", "163MQQQQQQQQQQQQLLQQQQQQLLLQQQQQQLLZLLLLZLLLZLLLLLLLLLLLLLLLZ", "7", "8","Baskerville", "11px"),
	FOURSIX("4/6", "155MLLLZLLLLLLLLLLLLLLLZLLLLZQQQQQQQQZQQQQQQQQQQQQLLQQQQZ", "7", "8","Baskerville", "11px"),
	TWOFOUR("2/4", "121MLLQQQQQQLLLLLLLLQQQQQQZLLLLZLLLZLLLLLLLLLLLLLLLZ", "7", "7","Baskerville", "11px"),
	TWOSIX("2/6", "185MLLQQQQQQLLLLLLLLQQQQQQZLLLLZQQQQQQQQZQQQQQQQQQQQQLLQQQQZ", "7", "7","Baskerville", "11px"),

	TWO_X("2x", "103MLLLLQQQQQQQQLQQQQQQQQZLLLLLLLLLLLLZ", "5", "2","Helvetica", "16px"),
	THREE_X("3x", "135MQQQQQQLQQQQQQLLLQQQQQQLQQQQQQZLLLLLLLLLLLLZ", "3", "6","Helvetica", "14px"),
	FOUR_X("4x", "59MLLLZLLLLLLLLLLLZLLLLLLLLLLLLZ", "3", "8","Helvetica", "14px"),
	FIVE_X("5x", "105MLLLLQQQQQQQQLQQQQQQQQLZLLLLLLLLLLLLZ", "6", "10","Helvetica", "14px"),
	SIX_X("6x", "129MQQQQQQQQZLQQQQQQQQQQQQQQQQZLLLLLLLLLLLLZ", "3", "6","Helvetica", "14px"),

	Three_S("3S", "215MQQQQQQLQQQQQQLLLQQQQQQLQQQQQQZLQQQQQQLQQQQQQLQQQQQQLQQQQQQZ", "3", "6","Helvetica", "14px"),
	Four_S("4S", "139MLLLZLLLLLLLLLLLZLQQQQQQLQQQQQQLQQQQQQLQQQQQQZ", "4", "9","Helvetica", "14px"),
	Six_S("6S", "209MQQQQQQQQZLQQQQQQQQQQQQQQQQZLQQQQQQLQQQQQQLQQQQQQLQQQQQQZ", "4", "6","Helvetica", "14px"),
	Q_S("?S", "203MLLLLZLLQQLQQQQQQLQQQQQQLQQQQLZLQQQQQQLQQQQQQLQQQQQQLQQQQQQZ", "4", "4","Helvetica", "14px"),
	
	ONE("1", "25MLLLLLLLLLLLZ", "2", "0","Baskerville", "14px"),
	TWO("2", "71MLLQQQQQQLLLLLLLLQQQQQQZ", "2.5", "6.5","Baskerville", "14px"),
	THREE("3", "113MQQQQQQQQQQQQLLQQQQQQLLLQQQQQQLLZ", "3", "9","Baskerville", "14px"),
	FOUR("4", "41MLLLZLLLLLLLLLLLLLLLZ", "-0.5", "3.0","Baskerville", "14px"),
	SIX("6", "105MQQQQQQQQZQQQQQQQQQQQQLLQQQQZ", "0.0", "0.0","Baskerville", "14px"),
	
	D("D", "49MLLQQQQLZLQQQQLLZ", "2", "6", "Helvetica", "10px"),
	QM("?", "95MQQQQQQQQZQQQQQQLLLQQQQQQLLZ", "1", "1.0", "Baskerville", "14px"),
	ALPHA("&#x03B1;", "107MLQQQQQQQQLLQLLQLLQQLQQLZLQQQQQQLZ", "-1.0", "1.0", "Serif", "12px"),
	BETA("&#x03B2;", "103MQQQQQLLLQQQQQLZLQQQQQQQQQQQLLZ", "1.5", "0.5", "Serif", "12px"),
	LC_O("o", "69MQQQQQQQQZQQQQQQQQZ", "0.0", "4.5", "SansSerif", "12px");
	// add constants for "?" "3|6", "2|6", etc
			
	/**
	 * a String holding the character that is mapped by the pathMapper object
	 */
	private String 	mappedChar;
	
	/**
	 * the digest String to be mapped to a character
	 */
	private String pSeq;
	
	/**
	 * the x-offset to properly align the character on the canvas
	 */
	private String dx;
	
	/**
	 * the y-offset to properly align the character on the canvas
	 */	
	private String dy;
	
	/**
	 * a String specifying the font-family to be used to render the character
	 */
	private String fontStr;
	
	/**
	 * the font size to be used to render the character (.e.g., "12px")
	 */
	private String size;
		
	/**
	 * Constructor for creating a new pathMapper object
	 * @param mappedChar a String holding the character that is mapped by the new pathMapper object
	 * @param pSeq the digest String to be mapped to a character
	 * @param dx the x-offset to properly align the character on the canvas
	 * @param dy the y-offset to properly align the character on the canvas
	 * @param fontStr a String specifying the font-family to be used to render the character
	 * @param size the font size to be used to render the character (.e.g., "12px")
	 */
	private PathMapper(String mappedChar, String pSeq, String dx, String dy, String fontStr, String size) {
		this.mappedChar = mappedChar;
		this.pSeq = pSeq;
		this.dx = dx;
		this.dy = dy;
		this.fontStr = fontStr;
		this.size = size;
	}
	
	/**
	 * provides access to a pathMapper object specifying the parameters for a given mapped character
	 * @param inputStr the digested "d" attribute of a path that was used to render the character
	 * @return a pathMapper object corresponding to a specific mapped character
	 */
    public static PathMapper forName( String inputStr )  {
        String probe = inputStr;

        for ( PathMapper obj : PathMapper.values() )
        {
            if ( obj.pSeq.equalsIgnoreCase(probe) )
            {
                return obj;
            }
        }
        // throw new Exception("Invalid sequence for pathMapper: " + inputStr);
        System.out.printf("\n\n### dMapStr cannot be mapped to a String ###");
        return(FAIL);
    }  
    
    /**
     * gets the mapped character for the active pathMapper object
     * @return the mapped character
     */
    public String getChar() 
    {  
        return this.mappedChar;  
    }
    
    /**
     * gets the digest String for the active pathMapper object
     * @return the digest String
     */
    public String getSeq() 
    {  
        return this.pSeq;  
    }

    /**
     * gets the x-offset for the active pathMapper object
     * @return the x-offset
     */
    public String getdx() 
    {  
        return this.dx;  
    }
    
    /**
     * gets the y-offset for the active pathMapper object
     * @return the y-offset
     */
    public String getdy() 
    {  
        return this.dy;  
    }
    
    /**
     * gets the font-family String for the active pathMapper object
     * @return the font-family String 
     */
    public String getFont() 
    {  
        return this.fontStr;  
    }
    
    /**
     * gets the font-size String for the active pathMapper object
     * @return the font-size String (e.g., "12px")
     */   
    public String getSize() 
    {  
        return this.size;  
    }
    
}
