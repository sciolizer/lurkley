module Main where

import Data.Char
import Data.List
import Data.Maybe

import Compile

main = do
  ls <- parseFile
  wBasicLines ls

wBasicLines bls = do
  w "var program = {\n"
  mapM_ (uncurry wBasicLine) (zip bls ([Just i | BasicLine i _ <- tail bls] ++ [Nothing]))
  w "};"

wBasicLine (BasicLine ln cmds) nextLn = wCompoundCommand ("line" ++ show ln) cmds nextLn

wCompoundCommand prefix cmds nextLn = go [] (zip cmds [0..]) where
  go _ [] = error "line has no commands"
  go additional ((cmd,suffix):cmds) = do
    w "  "
    let newPrefix = prefix ++ "_" ++ show suffix
    w prefix
    w "_"
    w (show suffix)
    w ": function(basic) { "
    extra <- wCommand cmd newPrefix
    case nextLn of
      Nothing -> w "basic._quit(); }\n"
      Just nln -> do
        w "basic._next(program."
        if null cmds
          then do w "line"
                  w (show nln)
                  w "_0); },\n"
                  let more = extra ++ additional
                  mapM_ (\(p,cds) -> wCompoundCommand p cds nextLn) more
          else do w prefix
                  w "_"
                  w (show (suffix + 1))
                  w "); },\n"
                  go (extra ++ additional) cmds

orElse :: Maybe Expr -> Integer -> W ()
orElse mb x = wExpr (fromMaybe (LiteralNumber (Left x)) mb)

wCommand cmd prefix =
  case cmd of
    Assign var mbIndex val -> do
      case mbIndex of
        Nothing -> wBasic "assign" [w (show var), wExpr val] >> return []
        Just ind -> wBasic "assignArr" [w (show var), wExpr ind, wExpr val] >> return []
    Circle (x, y) rad clr ratio start end ->
      wBasic "circle" [wExpr x, wExpr y, wExpr rad, maybe (w "undefined") wExpr clr, ratio `orElse` 1, start `orElse` 0, end `orElse` 1] >> return []

    Clear e -> wBasic "clear" [wExpr e] >> return []
    Color c1 c2 -> wBasic "color" (map wExpr [c1, c2]) >> return []
    Dim decls -> mapM_ (\(var,dim) -> wBasic "dim" [w (show var), wArray (map (wExpr . LiteralNumber . Left . toInteger) dim)]) decls >> return []
    Draw e -> wBasic "draw" [wExpr e] >> return []
    For var start end mbStep -> wBasic "for" [w (show var), wExpr start, wExpr end, mbStep `orElse` 1] >> return []
    Get Nothing (x2,y2) var -> wBasic "getTo" [wExpr x2, wExpr y2, w (show var)] >> return []
    Get (Just (x1, y1)) (x2,y2) var -> wBasic "get" [wExpr x1, wExpr y1, wExpr x2, wExpr y2, w (show var)] >> return []
    Gosub i -> wBasic "gosub" [w (show i)] >> return []
    Goto i -> wBasic "goto" [w (show i)] >> return []
    If be thenC elseC -> do
      w "if ("
      wBooleanExpr be
      w ") { "
      let branch suffix clause = -- line 180? How in the world?
            case clause of
              Left i -> do
                wBasic "goto" [w (show i)]
                w " } "
                return []
              Right moreCmds -> do
                w $ "basic._next(program." ++ prefix ++ suffix ++ "); } "
                return [(prefix ++ suffix, moreCmds)]
      tExtra <- branch "_then" thenC
      case elseC of
        Nothing -> return tExtra
        Just z -> do
          eExtra <- branch "_else" z
          return (tExtra ++ eExtra)
    Line Nothing (x2,y2) dm lm -> wBasic "lineTo" [wExpr x2, wExpr y2, w (show (drawMode dm)), w (show (lineMode lm))] >> return []
    Line (Just (x1,y1)) (x2,y2) dm lm -> wBasic "line" [wExpr x1, wExpr y1, wExpr x2, wExpr y2, w (show (drawMode dm)), w (show (lineMode lm))] >> return []
    Next mbVar -> wBasic "next" [w $ show (fromMaybe "" mbVar)] >> return []
    On var mode lns -> wBasic func [w (show var), wArray (map (w . show) lns)] >> return [] where
      func = case mode of { JumpGoto -> "onGoto"; JumpGosub -> "onGosub" }
    Paint (x,y) e1 e2 -> wBasic "paint" (map wExpr [x, y, e1, e2]) >> return []
    Pcls mbClr -> wBasic "pcls" [mbClr `orElse` 0 {- todo -}] >> return []
    Play e -> wBasic "play" [wExpr e] >> return []
    Pmode e1 e2 -> wBasic "pmode" (map wExpr [e1, e2]) >> return []
    Poke e1 e2 -> wBasic "poke" (map wExpr [e1, e2]) >> return []
    Pset (x,y) clr -> wBasic "pset" (map wExpr [x, y, clr]) >> return []
    Put Nothing (x2,y2) var -> wBasic "putTo" [wExpr x2, wExpr y2, w (show var)] >> return []
    Put (Just (x1,y1)) (x2,y2) var -> wBasic "put" [wExpr x1, wExpr y1, wExpr x2, wExpr y2, w (show var)] >> return []
    Rem s -> w "/* " >> w s >> w " */ " >> return []
    Return -> wBasic "return" [] >> return []
    Screen e1 e2 -> wBasic "screen" (map wExpr [e1, e2]) >> return []
    Sound e1 e2 -> wBasic "sound" (map wExpr [e1, e2]) >> return []

drawMode DrawPset = "pset"
drawMode DrawPreset = "preset"

lineMode LineLine = ""
lineMode LineBox = "b"
lineMode LineBoxFilled = "bf"

wBasicExpr :: String -> [W ()] -> W ()
wBasicExpr method args = do
  w "basic."
  w method
  w "("
  sequence_ (intersperse (w ", ") args) 
  w ")"

wBasic method args = do
  wBasicExpr method args
  w "; "

wArray arr = do
  w "["
  sequence_ (intersperse (w ", ") arr)
  w "]"

wBooleanExpr be = z where
  z =
    case be of
      (Compare cmp l r) -> wComparison cmp l r
      And l r -> combine "&&" l r
      Or l r -> combine "||" l r
  combine op l r = wBinary wBooleanExpr op l r

wBinary we op l r = do
  w "("
  we l
  w ") "
  w op
  w " ("
  we r
  w ")"

wComparison cmp l r = z where
  z = wBasicExpr (name cmp) (map wExpr [l, r])
  name cmp = downcase (show cmp)
  downcase "" = ""
  downcase (x:xs) = toLower x : xs

wExpr e =
  case e of
    Variable s Nothing -> wBasicExpr "recall" [w (show s)]
    Variable s (Just ind) -> wBasicExpr "recallArr" [w (show s), wExpr ind]
    LiteralString s -> w (show s)
    LiteralNumber (Left i) -> w (show i)
    LiteralNumber (Right f) -> w (show f)
    Add e1 e2 -> wBinary wExpr "+" e1 e2
    Subtract e1 e2 -> wBinary wExpr "-" e1 e2
    Multiply e1 e2 -> wBinary wExpr "*" e1 e2
    Divide e1 e2 -> wBinary wExpr "/" e1 e2
    Inkey -> wBasicExpr "inkey" []
    Function bi args -> wBasicExpr (builtInLib bi) (map wExpr args)

builtInLib :: BuiltIn -> String
builtInLib bi = z where
  (x:xs) = show bi
  z = case last xs of
        'S' -> toLower x : init xs
        _ -> toLower x : xs

type W = IO

w :: String -> W ()
w = putStr
