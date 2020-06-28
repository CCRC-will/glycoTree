package gctTOcsv;

public class GTreeException extends Exception {
    public GTreeException(String a_strMessage,Throwable a_objThrow)
    {
        super(a_strMessage,a_objThrow);
    }

    public GTreeException(String a_strMessage)
    {
        super(a_strMessage);
    }
    
    private static final long serialVersionUID = 1L;

}