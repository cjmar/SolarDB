// This file is used by Code Analysis to maintain SuppressMessage
// attributes that are applied to this project.
// Project-level suppressions either have no target or are given
// a specific target and scoped to a namespace, type, member, etc.

using System.Diagnostics.CodeAnalysis;

//Disable naming convention warning because VS doesn't like camel case starting with lower case
[assembly: SuppressMessage("Style", "IDE1006:Naming Styles", Justification = "Lower case for variables, upper case for Types")]