{-# LANGUAGE NoMonomorphismRestriction #-}
module Main where

import Control.Applicative hiding ((<|>), many)
import Control.Monad
import Data.Char
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
    Assign String (Maybe Expr {- ^ array index -}) Expr
  | Circle (Expr {- ^ x int -}, Expr {- ^ y int -}) Expr {- ^ radius int -} (Maybe Expr {- ^ int? -} ) (Maybe Expr {- ^ float x ellipse factor? -} ) (Maybe Expr {- ^ float y ellipse factor? -}) (Maybe Expr {- ^ float -})
  | Clear Expr -- probably just a no-op
  | Color Expr Expr
  -- | Data [Either Number String]
  | Dim [(String,[Int])]
  | Draw Expr
  | For String Expr Expr (Maybe Expr {- ^ step -})
  | Get (Maybe (Expr,Expr)) (Expr,Expr) String {- ^ variable? -} -- only usage is followed by a G; not sure what that means
  | Gosub Int
  | Goto Int
  | If BooleanExpr (Either Int Command) {- ^ then -} (Maybe (Either Int Command) {- ^ else -})
  | Line (Maybe (Expr,Expr)) (Expr,Expr) DrawMode LineMode
  | Next (Maybe String)
  | On String JumpMode [Int]
  | Paint (Expr, Expr) Expr Expr
  | Pcls (Maybe Expr)
  | Play Expr
  | Pmode Expr Expr
  | Poke Expr Expr
  | Pset (Expr,Expr) Expr
  | Put (Maybe (Expr,Expr)) (Expr,Expr) String
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
    And BooleanExpr BooleanExpr -- todo: check that either I am mixing precedence correctly, or else the program never uses and and or at the same time
  | Or BooleanExpr BooleanExpr
  | Compare Comparison Expr Expr
  deriving (Eq, Ord, Read, Show)

data Comparison = IsEqual | IsUnequal | IsLessThan | IsLessThanOrEqual | IsGreaterThan | IsGreaterThanOrEqual
  deriving (Bounded, Enum, Eq, Ord, Read, Show)

data Expr =
    Variable String (Maybe Expr {- ^ array index -})
  | LiteralString String
  | LiteralNumber Number
  | Add Expr Expr
  | Subtract Expr Expr
  | Multiply Expr Expr
  | Divide Expr Expr
  | Function BuiltIn [Expr]
  | Inkey
  | Len String
  deriving (Eq, Ord, Read, Show)

data BuiltIn =
  ChrS | Instr | Int | LeftS | MidS | Rnd | StrS | StringS | Val
  deriving (Bounded, Enum, Eq, Ord, Read, Show)

arity bi =
  case bi of
    ChrS -> 1
    Instr -> 2
    Int -> 1
    LeftS -> 2
    MidS -> 3
    Rnd -> 1
    StrS -> 1
    StringS -> 2
    Val -> 1

builtInName :: BuiltIn -> String
builtInName bi = z where
  s = show bi
  z = case last s of
        'S' -> (map toUpper (init s)) ++ "$"
        _ -> map toUpper s

{- Parser -}

capital = oneOf "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
basicDef = haskellDef {
  Lexer.caseSensitive = True,
  Lexer.identStart = capital,
  Lexer.identLetter = capital <|> oneOf "0123456789$",
  Lexer.reservedNames = ["AND", "CIRCLE", "CLEAR", "COLOR", {- "DATA", -} "DIM", "DRAW", "ELSE", "FOR", "GET", "GOSUB", "GOTO", "IF", "INKEY$", "LEN", "LINE", "NEXT", "ON", "OR", "PAINT", "PCLS", "PLAY", "PMODE", "POKE", "PRESET", "PSET", "PUT", "REM", "RETURN", "SCREEN", "SOUND", "STEP", "THEN", "TO"] ++ [builtInName x | x <- [minBound..maxBound]],
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
pNaturalOrFloat = pLexeme natFloat <?> "number" where
  natFloat = (char '0' >> zeroNumFloat) <|> decimalFloat
  zeroNumFloat = decimalFloat <|> fractFloat 0 <|> return (Left 0)
  decimalFloat = do { n <- pDecimal; option (Left n) (fractFloat n) } <|> (Right <$> fraction)
  fractFloat n = Right <$> fractExponent n
  fractExponent n = do { fract <- fraction; return $ fromInteger n + fract }
  fraction = (char '.' >> (foldr op 0.0 <$> many1 digit)) <?> "fraction"
  op d f = (f + fromIntegral (digitToInt d))/10.0
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
  cmds <- sepEndBy1 pCommand (pSymbol ":")
  return $ BasicLine n cmds

pCommand = pCircle <|> pClear <|> pColor <|> {- pData <|> -} pDim <|> pDraw <|> pFor <|> pGet <|> pGosub <|> pGoto <|> pIf <|> pLine <|> pNext <|> pOn <|> pPaint <|> pPcls <|> pPlay <|> pPmode <|> pPoke <|> pPset <|> pPut <|> pRem <|> pReturn <|> pScreen <|> pSound <|> pAssign <?> "command"

pCircle = do
  pReserved "CIRCLE"
  c <- pCoordinate
  pComma
  as <- pCommaSep (optionMaybe pExpr)
  case as of
    (Just radius : args) -> do
      when (length args > 4) . fail $ "too many args for circle" ++ show args
      let (a : ellipseX : ellipseY : b : _) = args ++ repeat Nothing
      return (Circle c radius a ellipseX ellipseY b)
    _ -> fail $ "circle args parsed as: " ++ show as

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
  pReserved "THEN"
  thn <- branch
  els <- optionMaybe (pReserved "ELSE" >> branch)
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
  Next <$> (optionMaybe pIdentifier)

pOn = do
  pReserved "ON"
  i <- pIdentifier
  jm <- pKeyword [("GOSUB", JumpGosub), ("GOTO", JumpGoto)]
  lns <- pCommaSep1 pNatural
  return $ On i jm lns

pPaint = do
  pReserved "PAINT"
  c <- pCoordinate
  pComma
  clr <- pExpr
  pComma
  something <- pExpr
  return (Paint c clr something)

pPcls = withSpace <|> withoutSpace where
  withSpace = pReserved "PCLS" >> (Pcls <$> optionMaybe pExpr)
  withoutSpace = try (string "PCLS" >> (Pcls . Just . LiteralNumber . Left . toInteger <$> pNatural))

pPlay = pReserved "PLAY" >> (Play <$> pExpr)

pPmode = pTwoArgs "PMODE" Pmode

pPoke = pTwoArgs "POKE" Poke

pPset = do
  pReserved "PSET"
  pParens $ do
    x <- pExpr
    pComma
    y <- pExpr
    pComma
    clr <- pExpr
    return $ Pset (x,y) clr

pPut = do
  pReserved "PUT"
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
  ind <- optionMaybe (pParens pExpr)
  pSymbol "="
  e <- pExpr
  return (Assign i ind e)

pRectangle = do
  ul <- optionMaybe pCoordinate
  pSymbol "-"
  lr <- pCoordinate
  return (ul, lr)

pCoordinate = pParens $ do
  x <- pExpr
  pComma
  y <- pExpr
  return (x, y)

pTwoArgs kw cons = do
  pReserved kw
  e1 <- pExpr
  pComma
  e2 <- pExpr
  return $ cons e1 e2

pBooleanExpr = z where
  joiner kw cons = do
    pReserved kw
    c <- pCompare
    return (flip cons c)
  z = do
    c <- pCompare
    cs <- many (joiner "AND" And <|> joiner "OR" Or)
    return $ foldl (\e j -> j e) c cs

pCompare = do
  l <- pExpr
  cons <- pKeywordOp [("=<", IsLessThanOrEqual), ("=>", IsGreaterThanOrEqual), ("=", IsEqual), ("<>", IsUnequal), ("<", IsLessThan), (">",IsGreaterThan)]
  r <- pExpr
  return (Compare cons l r)

pExpr = buildExpressionParser table pTerm <?> "expression" where
  table = [[b "*" Multiply, b "/" Divide],
           [b "+" Add, b "-" Subtract]]
  b op cons = Infix (pReservedOp op >> return cons) AssocLeft

pTerm = pParens pExpr <|> pLiteralString <|> pLiteralNumber <|> pVariable <|> pInkey <|> pLen <|> foldl1 (<|>) [pBuiltIn bi | bi <- [minBound..maxBound]] <?> "term"

pLiteralString = LiteralString <$> pStringLiteral

pLiteralNumber = LiteralNumber <$> (pNeg <|> pNaturalOrFloat) where
  pNeg = do
    char '-'
    n <- pInteger
    when (n < 0) $ unexpected (show n)
    return . Left . negate $ n

pBuiltIn bi = do
  let name = builtInName bi
  pReserved name
  exps <- pParens $ pCommaSep1 (pExpr)
  if length exps == arity bi
    then return $ Function bi exps
    else fail $ "wrong number of args for " ++ name ++ ": " ++ show exps

pInkey = pReserved "INKEY$" >> return Inkey

pLen = pReserved "LEN" >> (pParens $ Len <$> pIdentifier)

pVariable = Variable <$> pIdentifier <*> optionMaybe (pParens pExpr)

-- pKeyword :: [(String,a)] -> ParsecT s u m a

pKeyword = pLookup pReserved
pKeywordOp = pLookup pReservedOp
pLookup reserved kws = foldl (\p (kw,cons) -> (reserved kw >> return cons) <|> p) (fail $ "none of " ++ show (map fst kws)) kws
