{-# LANGUAGE NoMonomorphismRestriction #-}
module Compile where

import Control.Applicative hiding ((<|>), many)
import Control.Monad
import Text.Parsec
import Text.Parsec.Expr
import Text.Parsec.Language
import qualified Text.Parsec.Token as Lexer

main = do
  src <- readFile "LURKLEY.BASIC"
  let contents = lineStart "" (lines src)
  print $ (map parseBasicLine contents)

lineStart l [] = [l]
lineStart l (x:xs) | length x < 32 = blank (l++x) xs
                   | otherwise = lineContOrBlank (l++x) xs

blank l [] = [l]
blank l ("":xs) = l : lineStart "" xs
blank l (x:_) = error $ "blank expected after " ++ show l ++ " but found " ++ show x

lineContOrBlank l [] = [l]
lineContOrBlank l ("":xs) = l : lineStart "" xs
lineContOrBlank l (x:xs) | length x < 32 = blank (l++x) xs
                         | otherwise = lineContOrBlank (l++x) xs

type Number = Either Integer Double

data BasicLine = BasicLine Int [Command]
  deriving (Eq, Ord, Read, Show)

data Command =
    Assign String Expr
  | Circle (Expr {- ^ x int -}, Expr {- ^ y int -}) Expr {- ^ radius int -} (Maybe Expr {- ^ int? -} ) (Maybe Expr {- ^ float x ellipse factor? -} ) (Maybe Expr {- ^ float y ellipse factor? -}) (Maybe Expr {- ^ float -})
  | Clear Expr -- probably just a no-op
  | Color Expr Expr
  -- | Data [Either Number String]
  | Dim [(String,[Int])]
  | Draw Expr
  | For String Expr Expr (Maybe Expr {- ^ step -})
  | Get (Expr,Expr) (Expr,Expr) String {- ^ variable? -} -- only usage is followed by a G; not sure what that means
  | Gosub Int
  | Goto Int
  | If BooleanExpr (Either Int Command) {- ^ then -} (Maybe (Either Int Command) {- ^ else -})
  | Line (Expr,Expr) (Expr,Expr) DrawMode LineMode
  | Next String
  | On String JumpMode [Int]
  | Paint (Expr, Expr) Expr Expr
  | Pcls Expr
  | Play Expr
  | Pmode Expr Expr
  | Poke Expr Expr
  | Pset (Expr,Expr) Expr
  | Put (Expr,Expr) (Expr,Expr) String
  | Rem String
  | Return
  | Screen Expr Expr
  | Sound Expr Expr
  deriving (Eq, Ord, Read, Show)

data DrawMode = DrawPset | DrawPreset
  deriving (Bounded, Enum, Eq, Ord, Read, Show)

data LineMode = LineLine | LineBox | LineBoxFilled
  deriving (Bounded, Enum, Eq, Ord, Read, Show)

data JumpMode = JumpGoto | JumpGosub
  deriving (Bounded, Enum, Eq, Ord, Read, Show)

data BooleanExpr =
    And BooleanExpr BooleanExpr
  | Or BooleanExpr BooleanExpr
  | Compare Comparison Expr Expr
  deriving (Eq, Ord, Read, Show)

data Comparison = IsEqual | IsUnequal | IsLessThan | IsLessThanOrEqual | IsGreaterThan | IsGreaterThanOrEqual
  deriving (Bounded, Enum, Eq, Ord, Read, Show)

data Expr =
    Variable String
  | LiteralString String
  | LiteralNumber Number
  | Add Expr Expr
  | Subtract Expr Expr
  | Multiply Expr Expr
  | Divide Expr Expr
  | Inkey Expr
  | Instr Expr
  | Len String
  | Med Expr Expr Expr
  | Rnd Expr
  | Str Expr
  | Val Expr
  deriving (Eq, Ord, Read, Show)

{- Parser -}

capital = oneOf "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
basicDef = haskellDef {
  Lexer.caseSensitive = True,
  Lexer.identStart = capital,
  Lexer.identLetter = capital <|> char '$',
  Lexer.reservedNames = ["AND", "CIRCLE", "CLEAR", "COLOR", {- "DATA", -} "DIM", "DRAW", "ELSE", "FOR", "GET", "GOSUB", "GOTO", "IF", "INKEY$", "INSTR", "LEN", "LINE", "MED$", "NEXT", "ON", "OR", "PAINT", "PCLS", "PLAY", "PMODE", "POKE", "PRESET", "PSET", "PUT", "REM", "RETURN", "RND", "SCREEN", "SOUND", "STEP", "STR$", "THEN", "TO", "VAL"],
  Lexer.reservedOpNames = ["+","-","*","/","=","<>","<",">","=<","=>"]
  }
lexer = Lexer.makeTokenParser basicDef

pIdentifier = Lexer.identifier lexer
pReserved = Lexer.reserved lexer
pOperator = Lexer.operator lexer
pReservedOp = Lexer.reservedOp lexer
pCharLiteral = Lexer.charLiteral lexer
pStringLiteral = Lexer.stringLiteral lexer
pNatural = toInt <$> Lexer.natural lexer where
  toInt :: Integer -> Int
  toInt = fromIntegral
pInteger = Lexer.integer lexer
pFloat = Lexer.float lexer
pNaturalOrFloat = Lexer.naturalOrFloat lexer
pDecimal = Lexer.decimal lexer
pHexadecimal = Lexer.hexadecimal lexer
pOctal = Lexer.octal lexer
pSymbol = Lexer.symbol lexer
pLexeme = Lexer.lexeme lexer
pWhiteSpace = Lexer.whiteSpace lexer
pParens = Lexer.parens lexer
pBraces = Lexer.braces lexer
pAngles = Lexer.angles lexer
pBrackets = Lexer.brackets lexer
pSquares = Lexer.squares lexer
pSemi = Lexer.semi lexer
pComma = Lexer.comma lexer
pColon = Lexer.colon lexer
pDot = Lexer.dot lexer
pSemiSep = Lexer.semiSep lexer
pSemiSep1 = Lexer.semiSep1 lexer
pCommaSep = Lexer.commaSep lexer
pCommaSep1 = Lexer.commaSep1 lexer

parseBasicLine line =
  case lex line of
    [(lineNumber, _)] ->
      case parse pBasicLine ("line " ++ lineNumber) line of
        Left pe -> error $ show pe
        Right pl -> pl
    _ -> error $ "no apparent line number in " ++ line

pBasicLine = do
  n <- pNatural
  cmds <- sepBy1 pCommand (pSymbol ":")
  return $ BasicLine n cmds

pCommand = pCircle <|> pClear <|> pColor <|> {- pData <|> -} pDim <|> pDraw <|> pFor <|> pGet <|> pGosub <|> pGoto <|> pIf <|> pLine <|> pNext <|> pOn <|> pPaint <|> pPcls <|> pPlay <|> pPmode <|> pPoke <|> pPset <|> pPut <|> pRem <|> pReturn <|> pScreen <|> pSound <|> pAssign <?> "command"

pCircle = do
  c <- pCoordinate
  (radius:args) <- pCommaSep pExpr
  when (length args > 4) . fail $ "too many args for circle" ++ show args
  let (a : ellipseX : ellipseY : b : _) = map Just args ++ repeat Nothing
  return (Circle c radius a ellipseX ellipseY b)

pClear = pReserved "CLEAR" >> (Clear <$> pExpr)

pColor = pTwoArgs "COLOR" Color

{-
pData = do
  pReserved "DATA"
  datum <- pCommaSep ((Left <$> pNaturalOrFloat) <|> (Right <$> pStringLiteral))
  return (Data datum)
  -}

pDim = do
  pReserved "DIM"
  decls <- many ((,) <$> pIdentifier <*> pParens (pCommaSep1 pNatural))
  return (Dim decls)

pDraw = pReserved "DRAW" >> (Draw <$> pExpr)

pFor = do
  pReserved "FOR"
  i <- pIdentifier
  pSymbol "="
  start <- pExpr
  pReserved "TO"
  end <- pExpr
  step <- optionMaybe $ do
    pReserved "STEP"
    pExpr
  return (For i start end step)

pGet = do
  pReserved "GET"
  (ul, lr) <- pRectangle
  pComma
  i <- pIdentifier
  return (Get ul lr i)

pGosub = do
  pReserved "GOSUB"
  Gosub <$> pNatural

pGoto = do
  pReserved "GOTO"
  Goto <$> pNatural

pIf = do
  pReserved "IF"
  b <- pBooleanExpr
  let branch = (Left <$> pNatural) <|> (Right <$> pCommand)
  thn <- branch
  els <- optionMaybe branch
  return (If b thn els)

pLine = do
  pReserved "LINE"
  (ul,lr) <- pRectangle
  pComma
  dm <- pKeyword [("PSET", DrawPset), ("PRESET", DrawPreset)]
  lm <- option LineLine $ do
    pComma
    pKeyword [("B", LineBox), ("BF", LineBoxFilled)]
  return $ Line ul lr dm lm

pNext = do
  pReserved "NEXT"
  Next <$> pIdentifier

pOn = do
  pReserved "ON"
  i <- pIdentifier
  jm <- pKeyword [("GOSUB", JumpGosub), ("GOTO", JumpGoto)]
  lns <- pCommaSep1 pNatural
  return $ On i jm lns

pPaint = do
  c <- pCoordinate
  pComma
  clr <- pExpr
  pComma
  something <- pExpr
  return (Paint c clr something)

pPcls = pReserved "PCLS" >> (Pcls <$> pExpr)

pPlay = pReserved "PLAY" >> (Play <$> pExpr)

pPmode = pTwoArgs "PMODE" Pmode

pPoke = pTwoArgs "POKE" Poke

pPset = do
  c <- pCoordinate
  pComma
  clr <- pExpr
  return $ Pset c clr

pPut = do
  (ul,lr) <- pRectangle
  pComma
  i <- pIdentifier
  return $ Put ul lr i

pRem = do
  pReserved "REM"
  Rem <$> many anyChar

pReturn = pReserved "RETURN" >> return Return

pScreen = pTwoArgs "SCREEN" Screen

pSound = pTwoArgs "SOUND" Sound

pAssign = do
  i <- pIdentifier
  pSymbol "="
  e <- pExpr
  return (Assign i e)

pRectangle = do
  ul <- pCoordinate
  pSymbol "-"
  lr <- pCoordinate
  return (ul, lr)

pCoordinate = pParens $ do
  x <- pExpr
  pComma
  y <- pExpr
  return (x, y)

pBooleanExpr = pAnd <|> pOr <|> pCompare <?> "boolean expression" where
  pAnd = b "AND" And
  pOr = b "OR" Or
  b kw cons = do
    l <- pCompare
    pReserved kw
    r <- pBooleanExpr
    return (cons l r)

pCompare = c "=" IsEqual <|> c "<>" IsUnequal <|> c "<" IsLessThan <|> c "=<" IsLessThanOrEqual <|> c ">" IsGreaterThan <|> c "=>" IsGreaterThanOrEqual where
  c op cons = do
    l <- pExpr
    pReservedOp op
    r <- pExpr
    return (Compare cons l r)

pExpr = buildExpressionParser table pTerm <?> "expression" where
  table = [[b "*" Multiply, b "/" Divide],
           [b "+" Add, b "-" Subtract]]
  b op cons = Infix (pReservedOp op >> return cons) AssocLeft

pTerm = pParens pExpr <|> pLiteralString <|> pLiteralNumber <|> pInkey <|> pInstr <|> pLen <|> pMed <|> pRnd <|> pStr <|> pVal <|> pVariable <?> "term"

pLiteralString = LiteralString <$> pStringLiteral

pLiteralNumber = LiteralNumber <$> pNaturalOrFloat

pInkey = pReserved "INKEY$" >> (pParens $ Inkey <$> pExpr)

pInstr = pReserved "INSTR" >> (pParens $ Instr <$> pExpr)

pLen = pReserved "LEN" >> (pParens $ Len <$> pIdentifier)

pMed = do
  pReserved "MED$"
  pParens $ do
    x <- pExpr
    pComma
    y <- pExpr
    pComma
    z <- pExpr
    return $ Med x y z

pRnd = pReserved "RND" >> (pParens $ Rnd <$> pExpr)

pStr = pReserved "STR$" >> (pParens $ Str <$> pExpr)

pVal = pReserved "VAL" >> (pParens $ Val <$> pExpr)

pVariable = Variable <$> pIdentifier

pTwoArgs kw cons = do
  pReserved kw
  e1 <- pExpr
  pComma
  e2 <- pExpr
  return $ cons e1 e2

-- pKeyword :: [(String,a)] -> ParsecT s u m a
pKeyword kws = foldl (\p (kw,cons) -> (pReserved kw >> return cons) <|> p) (fail $ "none of " ++ show (map fst kws)) kws
